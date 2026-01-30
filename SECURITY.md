# Security Best Practices & Configuration Guide

## Overview

Healio.AI has been hardened with comprehensive security measures following OWASP best practices. This document outlines all security features, configuration options, and maintenance procedures.

## Security Features Implemented

### 1. Rate Limiting

<Configured on both backend and frontend to prevent abuse and DoS attacks.

**Backend (FastAPI):**
- Global rate limit: 100 requests/minute per IP
- File upload limit: 20 uploads/minute per IP
- Custom 429 error responses with `Retry-After` headers

**Frontend (Next.js):**
- Client-side debouncing (500ms) on form submissions
- Request throttling for API calls
- In-memory rate tracking

**Configuration:** Edit `backend/.env` to adjust limits:
```env
RATE_LIMIT_PER_MINUTE=100
UPLOAD_RATE_LIMIT_PER_MINUTE=20
```

### 2. Input Validation & Sanitization

**Type**: Every user input is validated against strict schemas using Zod.

**Implemented on:**
- ✅ Symptom intake forms (`IntakeCard`)
- ✅ Authentication forms (login/signup)
- ✅ Chat messages
- ✅ Profile updates
- ✅ File uploads

**Validation Rules:**
- Length limits on all text fields (prevents DoS)
- Type checking (string, number, email, etc.)
- Format validation (email, phone, etc.)
- Enum validation for dropdown values
- Rejection of unexpected fields

**Sanitization:**
- HTML/script tag removal (XSS prevention)
- Control character removal
- Null byte filtering
- SQL injection pattern detection

### 3. Secure API Key Handling

**Environment Variables:**
- All secrets in `.env` and `.env.local` files
- Never committed to git (enforced by `.gitignore`)
- Separate keys for development and production
- `NEXT_PUBLIC_*` prefix only for non-sensitive values

**Files:**
- `.env.local` - Frontend secrets (Supabase keys)
- `backend/.env` - Backend configuration
- `.env.example` - Template with documentation

### 4. File Upload Security

**Backend Validation:**
- File size limit: 10MB (configurable)
- MIME type whitelist
- Extension validation
- Filename sanitization (path traversal protection)
- Virus scanning ready (extensible)

**Allowed File Types (default):**
- Images: JPG, PNG, GIF
- Documents: PDF, DOC, DOCX, TXT

**Configuration:**
```env
MAX_UPLOAD_SIZE_MB=10
ALLOWED_FILE_EXTENSIONS=jpg,jpeg,png,gif,pdf,doc,docx,txt
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,application/pdf,...
```

### 5. CORS Configuration

**Configured Origins:**
- `http://localhost:3000` (Next.js development)
- `http://localhost:8000` (Backend)
- Production domain (add when deployed)

**Configuration:** Edit `backend/.env`:
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000,https://your-domain.com
```

## Environment Setup

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Start server:**
   ```bash
   python main.py
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## API Key Rotation Procedure

### When to Rotate:
- Every 90 days (recommended)
- After suspected compromise
- When team member leaves
- Before major deployments

### How to Rotate:

**Supabase Keys:**
1. Log in to Supabase dashboard
2. Go to Project Settings > API
3. Generate new keys
4. Update `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=new_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=new_anon_key
   ```
5. Restart application
6. Revoke old keys in Supabase

**Backend Environment:**
1. Update `backend/.env` with new values
2. Restart backend server
3. Test all endpoints

## Security Testing Checklist

### Rate Limiting Tests

```bash
# Test backend rate limit
for i in {1..150}; do curl http://localhost:8000/; done
# Should see 429 errors after limit

# Test upload rate limit
for i in {1..30}; do curl -F "file=@test.jpg" http://localhost:8000/upload; done
```

### Input Validation Tests

**Test Cases:**
1. ❌ XSS: `<script>alert('xss')</script>`
2. ❌ SQL Injection: `'; DROP TABLE users--`
3. ❌ Path Traversal: `../../etc/passwd`
4. ❌ Null bytes: `file\x00.txt`
5. ❌ Excessive length: 10,000 character strings
6. ✅ Valid input: Normal user data

### File Upload Tests

```bash
# Test oversized file (should reject)
dd if=/dev/zero of=test.bin bs=1M count=15
curl -F "file=@test.bin" http://localhost:8000/upload

# Test invalid extension (should reject)
echo "test" > test.exe
curl -F "file=@test.exe" http://localhost:8000/upload

# Test valid file (should accept)
curl -F "file=@valid_image.jpg" http://localhost:8000/upload
```

## Production Deployment

### Pre-Deployment Checklist

-  [ ] All secrets moved to environment variables
- [ ] `.env` and `.env.local` added to `.gitignore`
- [ ] CORS origins updated for production domain
- [ ] Rate limits appropriate for production traffic
- [ ] SSL/TLS certificates configured
- [ ] Database credentials rotated
- [ ] Error messages don't expose system details
- [ ] Logging configured (no sensitive data in logs)

### Production Environment Variables

**Backend:**
```env
ALLOWED_ORIGINS=https://your-domain.com
RATE_LIMIT_PER_MINUTE=200  # Adjust based on traffic
UPLOAD_RATE_LIMIT_PER_MINUTE=50
HOST=0.0.0.0
PORT=8000
```

**Frontend:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_key
```

## Incident Response

### If API Key is Compromised:

1. **Immediately rotate** all affected keys
2. **Review logs** for unauthorized access
3. **Check database** for data breaches
4. **Notify users** if personal data affected
5. **Document incident** for future prevention

### If DoS Attack Detected:

1. **Verify rate limiting** is active
2. **Block abusive IPs** at firewall level
3. **Increase rate limits temporarily** if needed
4. **Contact hosting provider** for DDoS mitigation
5. **Review attack patterns** and update defenses

## Monitoring & Maintenance

### Regular Security Tasks:

**Weekly:**
- Review error logs for suspicious activity
- Monitor rate limit hits

**Monthly:**
- Update dependencies (`npm audit`, `pip list --outdated`)
- Review and update allowed CORS origins
- Test backup/recovery procedures

**Quarterly:**
- Rotate API keys
- Security audit of new features
- Review and update rate limits
- Penetration testing

### Logging Recommendations:

Monitor these events:
- Failed login attempts (potential brute force)
- Rate limit exceeded (potential DoS)
- Invalid file upload attempts
- Validation errors (potential probing)
- Successful admin actions

**DO NOT log:**
- Passwords or tokens
- Personal health information
- Credit card numbers
- Session IDs

## OWASP Top 10 Mitigations

| Risk | Mitigation Implemented |
|------|----------------------|
| A01: Broken Access Control | Supabase RLS + Authentication required |
| A02: Cryptographic Failures | HTTPS, hashed passwords (Supabase) |
| A03: Injection | Zod validation, input sanitization |
| A04: Insecure Design | Secure-by-default architecture |
| A05: Security Misconfiguration | Environment-based config, minimal defaults |
| A06: Vulnerable Components | Regular dependency updates |
| A07: Authentication Failures | Rate limiting, password requirements |
| A08: Data Integrity Failures | Input validation, CSRF protection |
| A09: Logging Failures | Comprehensive error logging |
| A10: Server-Side Request Forgery | URL sanitization |

## Contact & Support

For security issues or questions:
- **Security vulnerabilities:** Use GitHub Security Advisories
- **General questions:** Check documentation first
- **Configuration help:** Refer to `.env.example` files

---

**Last Updated:** January 2026  
**Version:** 1.0.0
