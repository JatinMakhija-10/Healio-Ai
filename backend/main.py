from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
import shutil
import os
import re
from pathlib import Path
from dotenv import load_dotenv
from email_service import EmailService

# Load environment variables
load_dotenv()

# Configuration from environment variables with secure defaults
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8000").split(",")
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "100"))
UPLOAD_RATE_LIMIT_PER_MINUTE = int(os.getenv("UPLOAD_RATE_LIMIT_PER_MINUTE", "20"))
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
ALLOWED_FILE_EXTENSIONS = set(os.getenv("ALLOWED_FILE_EXTENSIONS", "jpg,jpeg,png,gif,pdf,doc,docx,txt").split(","))
ALLOWED_MIME_TYPES = set(os.getenv("ALLOWED_MIME_TYPES", 
    "image/jpeg,image/png,image/gif,application/pdf,application/msword,"
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain").split(","))
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
BACKEND_API_KEY = os.getenv("BACKEND_API_KEY", "")

# API Key authentication dependency
async def verify_api_key(x_api_key: str = Header(default="")):
    """Verify the API key from the X-API-Key header."""
    if not BACKEND_API_KEY:
        return  # No key configured = auth disabled (dev mode)
    if x_api_key != BACKEND_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Determine root path for Vercel
# Vercel rewrites /api/py/... to this app, so we need to tell FastAPI about the prefix
root_path = "/api/py" if os.getenv("VERCEL") else ""

app = FastAPI(
    title="Healio.AI Backend API", 
    version="1.0.0",
    root_path=root_path
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS with environment-based origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # Explicit methods instead of wildcard
    allow_headers=["Content-Type", "Authorization", "X-API-Key"],  # Explicit headers
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Pydantic models for request validation
class FileUploadResponse(BaseModel):
    """Response model for file uploads"""
    filename: str
    status: str
    message: str
    size_bytes: Optional[int] = None

# Email models
class DiagnosisEmailRequest(BaseModel):
    """Request model for sending diagnosis emails"""
    to_email: EmailStr
    user_name: str
    diagnosis_summary: str
    top_conditions: List[Dict[str, Any]]
    consultation_id: str

class ReminderEmailRequest(BaseModel):
    """Request model for sending reminder emails"""
    to_email: EmailStr
    user_name: str
    reminder_type: str  # 'medication' or 'appointment'
    reminder_details: Dict[str, Any]

class HealthTipEmailRequest(BaseModel):
    """Request model for sending health tip emails"""
    to_email: EmailStr
    user_name: str
    tip_title: str
    tip_content: str
    size_bytes: Optional[int] = None

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal attacks and other security issues.
    
    OWASP Security: Removes path separators, null bytes, and control characters.
    """
    # Remove any path components (handles both Unix and Windows paths)
    filename = os.path.basename(filename)
    
    # Remove null bytes and control characters
    filename = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', filename)
    
    # Remove or replace dangerous characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    
    # Prevent hidden files
    if filename.startswith('.'):
        filename = '_' + filename[1:]
    
    # Ensure filename is not empty after sanitization
    if not filename or filename == '_':
        filename = 'unnamed_file'
    
    # Limit filename length (prevent DoS via extremely long filenames)
    max_length = 255
    if len(filename) > max_length:
        name, ext = os.path.splitext(filename)
        filename = name[:max_length - len(ext)] + ext
    
    return filename

def validate_file_upload(file: UploadFile) -> tuple[bool, str]:
    """
    Validate file upload against security constraints.
    
    Returns: (is_valid, error_message)
    """
    # Check file extension
    file_ext = Path(file.filename or '').suffix.lower().lstrip('.')
    if file_ext not in ALLOWED_FILE_EXTENSIONS:
        return False, f"File type '.{file_ext}' not allowed. Allowed types: {', '.join(ALLOWED_FILE_EXTENSIONS)}"
    
    # Check MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        return False, f"File MIME type '{file.content_type}' not allowed"
    
    # Check file size (if available in headers)
    if file.size and file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        return False, f"File size exceeds maximum allowed size of {MAX_UPLOAD_SIZE_MB}MB"
    
    return True, ""

@app.get("/")
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def read_root(request: Request):
    """
    Health check endpoint.
    
    Rate limit: Configurable via environment (default: 100/minute)
    """
    return {
        "message": "Healio.AI Backend API is running",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.post("/upload", response_model=FileUploadResponse, dependencies=[Depends(verify_api_key)])
@limiter.limit(f"{UPLOAD_RATE_LIMIT_PER_MINUTE}/minute")
async def upload_file(request: Request, file: UploadFile = File(...)):
    """
    Secure file upload endpoint with validation and sanitization.
    
    Security features:
    - Rate limiting (default: 20 uploads/minute per IP)
    - File type validation (extension + MIME type)
    - Filename sanitization (prevents path traversal)
    - File size limits (default: 10MB max)
    
    Rate limit: Configurable via environment (default: 20/minute)
    """
    try:
        # Validate file is provided
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No file provided"
            )
        
        # Validate file type and size
        is_valid, error_message = validate_file_upload(file)
        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail=error_message
            )
        
        # Sanitize filename to prevent path traversal and injection attacks
        safe_filename = sanitize_filename(file.filename)
        
        # Read file content with size limit enforcement
        max_bytes = MAX_UPLOAD_SIZE_MB * 1024 * 1024
        file_content = await file.read(max_bytes + 1)  # Read one extra byte to detect oversized files
        
        if len(file_content) > max_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"File size exceeds maximum allowed size of {MAX_UPLOAD_SIZE_MB}MB"
            )
        
        # Save file with sanitized name
        file_location = os.path.join(UPLOAD_DIR, safe_filename)
        
        # Prevent overwriting existing files (optional - add timestamp if needed)
        if os.path.exists(file_location):
            base, ext = os.path.splitext(safe_filename)
            counter = 1
            while os.path.exists(file_location):
                file_location = os.path.join(UPLOAD_DIR, f"{base}_{counter}{ext}")
                counter += 1
        
        # Write file securely
        with open(file_location, "wb") as buffer:
            buffer.write(file_content)
        
        return FileUploadResponse(
            filename=safe_filename,
            status="success",
            message="File uploaded successfully",
            size_bytes=len(file_content)
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log the error (in production, use proper logging)
        print(f"Upload error: {str(e)}")
        # Don't expose internal error details to client
        raise HTTPException(
            status_code=500,
            detail="An error occurred during file upload. Please try again."
        )
    finally:
        # Always close the file
        await file.close()

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom rate limit exceeded handler with graceful 429 response.
    
    OWASP Security: Provides clear feedback without exposing system details.
    """
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "message": "Too many requests. Please slow down and try again later.",
            "retry_after": "60 seconds"
        },
        headers={
            "Retry-After": "60"
        }
    )

# ======================
# Email API Endpoints
# ======================

@app.post("/api/email/diagnosis", dependencies=[Depends(verify_api_key)])
@limiter.limit("10/minute")
async def send_diagnosis_email(request: Request, email_req: DiagnosisEmailRequest):
    """
    Send diagnosis completion email
    
    Rate limit: 10/minute to prevent spam
    """
    try:
        success = await EmailService.send_diagnosis_complete(
            to_email=email_req.to_email,
            user_name=email_req.user_name,
            diagnosis_summary=email_req.diagnosis_summary,
            top_conditions=email_req.top_conditions,
            consultation_id=email_req.consultation_id
        )
        
        if success:
            return {"status": "success", "message": "Diagnosis email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
            
    except Exception as e:
        print(f"Email error: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred sending the email")

@app.post("/api/email/reminder", dependencies=[Depends(verify_api_key)])
@limiter.limit("20/minute")
async def send_reminder_email(request: Request, email_req: ReminderEmailRequest):
    """
    Send reminder email (medication or appointment)
    
    Rate limit: 20/minute
    """
    try:
        success = await EmailService.send_reminder(
            to_email=email_req.to_email,
            user_name=email_req.user_name,
            reminder_type=email_req.reminder_type,
            reminder_details=email_req.reminder_details
        )
        
        if success:
            return {"status": "success", "message": "Reminder email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
            
    except Exception as e:
        print(f"Email error: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred sending the email")

@app.post("/api/email/health-tip", dependencies=[Depends(verify_api_key)])
@limiter.limit("5/minute")
async def send_health_tip_email(request: Request, email_req: HealthTipEmailRequest):
    """
    Send health tip email
    
    Rate limit: 5/minute
    """
    try:
        success = await EmailService.send_health_tip(
            to_email=email_req.to_email,
            user_name=email_req.user_name,
            tip_title=email_req.tip_title,
            tip_content=email_req.tip_content
        )
        
        if success:
            return {"status": "success", "message": "Health tip email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
            
    except Exception as e:
        print(f"Email error: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred sending the email")

if __name__ == "__main__":
    import uvicorn
    
    # Validate required environment variables on startup
    print("🔒 Security Configuration:")
    print(f"  ✓ Rate Limit: {RATE_LIMIT_PER_MINUTE} requests/minute")
    print(f"  ✓ Upload Rate Limit: {UPLOAD_RATE_LIMIT_PER_MINUTE} uploads/minute")
    print(f"  ✓ Max Upload Size: {MAX_UPLOAD_SIZE_MB}MB")
    print(f"  ✓ Allowed CORS Origins: {', '.join(ALLOWED_ORIGINS)}")
    print(f"  ✓ Allowed File Types: {', '.join(ALLOWED_FILE_EXTENSIONS)}")
    
    uvicorn.run(app, host=HOST, port=PORT)
