"""
Email Notification Service for Healio.AI

Handles sending transactional emails using Resend API.
Supports diagnosis results, reminders, and health tips.
"""

import os
from typing import Optional, Dict, Any
from datetime import datetime
import resend
from dotenv import load_dotenv

load_dotenv()

# Configure Resend API
resend.api_key = os.getenv("RESEND_API_KEY", "")

# Email configuration
FROM_EMAIL = os.getenv("FROM_EMAIL", "Healio.AI <notifications@healio.ai>")
REPLY_TO_EMAIL = os.getenv("REPLY_TO_EMAIL", "support@healio.ai")

class EmailService:
    """Service for sending various types of email notifications"""
    
    @staticmethod
    async def send_diagnosis_complete(
        to_email: str,
        user_name: str,
        diagnosis_summary: str,
        top_conditions: list,
        consultation_id: str
    ) -> bool:
        """
        Send diagnosis completion email with results summary
        
        Args:
            to_email: Recipient email address
            user_name: User's name
            diagnosis_summary: Brief summary of diagnosis
            top_conditions: List of top diagnosed conditions
            consultation_id: Unique consultation identifier
            
        Returns:
            bool: True if email sent successfully
        """
        try:
            conditions_html = "".join([
                f"<li style='margin: 8px 0;'><strong>{cond.get('name', 'Unknown')}</strong> "
                f"({cond.get('confidence', 0):.0f}% match)</li>"
                for cond in top_conditions[:3]
            ])
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                        line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
                
                <div style="background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%); 
                            padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Healio.AI</h1>
                    <p style="color: rgba(255,255,255,0.9); margin:10px 0 0 0; font-size: 16px;">
                        Your Health Diagnosis is Ready
                    </p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 8px; 
                            box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    
                    <p style="font-size: 16px; margin-bottom: 20px;">
                        Hi <strong>{user_name}</strong>,
                    </p>
                    
                    <p style="font-size: 16px; margin-bottom: 20px;">
                        Your diagnosis consultation has been completed. Here's a summary of our findings:
                    </p>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; 
                                border-left: 4px solid #0d9488; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b; font-weight: 600;">
                            DIAGNOSIS SUMMARY
                        </p>
                        <p style="margin: 0; font-size: 16px; color: #1e293b;">
                            {diagnosis_summary}
                        </p>
                    </div>
                    
                    <h3 style="color: #1e293b; font-size: 18px; margin: 30px 0 15px 0;">
                        Top Possible Conditions:
                    </h3>
                    <ul style="padding-left: 20px; margin: 0;">
                        {conditions_html}
                    </ul>
                    
                    <div style="background: #fef3c7; padding: 16px; border-radius: 8px; 
                                margin: 30px 0; border-left: 4px solid #f59e0b;">
                        <p style="margin: 0; font-size: 14px; color: #92400e;">
                            <strong>⚠️ Important:</strong> This is an informational tool and not a substitute 
                            for professional medical advice. Please consult a healthcare provider for a 
                            definitive diagnosis and treatment plan.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://healio.ai/dashboard/history" 
                           style="display: inline-block; background: #0d9488; color: white; 
                                  padding: 14px 32px; text-decoration: none; border-radius: 8px; 
                                  font-weight: 600; font-size: 16px;">
                            View Full Report
                        </a>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                    
                    <p style="font-size: 14px; color: #64748b; margin: 0;">
                        Consultation ID: {consultation_id}<br>
                        Date: {datetime.now().strftime("%B %d, %Y at %I:%M %p")}
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding: 20px; color: #64748b; font-size: 14px;">
                    <p style="margin: 0 0 10px 0;">
                        Stay healthy with Healio.AI 🌿
                    </p>
                    <p style="margin: 0;">
                        <a href="https://healio.ai/unsubscribe" style="color: #0d9488;">Unsubscribe</a> | 
                        <a href="https://healio.ai/help" style="color: #0d9488;">Help</a>
                    </p>
                </div>
                
            </body>
            </html>
            """
            
            params = {
                "from": FROM_EMAIL,
                "to": [to_email],
                "subject": f"Your Healio.AI Diagnosis Results - {datetime.now().strftime('%b %d, %Y')}",
                "html": html_content,
                "reply_to": REPLY_TO_EMAIL
            }
            
            email = resend.Emails.send(params)
            print(f"✅ Diagnosis email sent to {to_email}: {email}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send diagnosis email: {str(e)}")
            return False
    
    @staticmethod
    async def send_reminder(
        to_email: str,
        user_name: str,
        reminder_type: str,
        reminder_details: Dict[str, Any]
    ) -> bool:
        """
        Send reminder email (medication, appointment, etc.)
        
        Args:
            to_email: Recipient email
            user_name: User's name
            reminder_type: Type of reminder (medication, appointment)
            reminder_details: Dictionary with reminder specifics
            
        Returns:
            bool: Success status
        """
        try:
            # Build reminder content based on type
            if reminder_type == "medication":
                title = "💊 Medication Reminder"
                details = f"""
                <p style="font-size: 16px; margin-bottom: 15px;">
                    Time to take your medication:
                </p>
                <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 5px 0;"><strong>Medicine:</strong> {reminder_details.get('medicine', 'N/A')}</p>
                    <p style="margin: 5px 0;"><strong>Dosage:</strong> {reminder_details.get('dosage', 'N/A')}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> {reminder_details.get('time', 'N/A')}</p>
                </div>
                """
            elif reminder_type == "appointment":
                title = "📅 Appointment Reminder"
                details = f"""
                <p style="font-size: 16px; margin-bottom: 15px;">
                    You have an upcoming appointment:
                </p>
                <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 5px 0;"><strong>Doctor:</strong> {reminder_details.get('doctor', 'N/A')}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> {reminder_details.get('date', 'N/A')}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> {reminder_details.get('time', 'N/A')}</p>
                    <p style="margin: 5px 0;"><strong>Location:</strong> {reminder_details.get('location', 'N/A')}</p>
                </div>
                """
            else:
                title = "🔔 Health Reminder"
                details = f"<p>{reminder_details.get('message', 'You have a health reminder.')}</p>"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
            </head>
            <body style="font-family: sans-serif; line-height: 1.6; color: #334155; max-width: 600px; 
                        margin: 0 auto; padding: 20px;">
                <div style="background: #0d9488; padding: 25px; border-radius: 12px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">{title}</h1>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 8px; margin-top: 20px;">
                    <p>Hi <strong>{user_name}</strong>,</p>
                    {details}
                    <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
                        Take care of your health! 💚
                    </p>
                </div>
            </body>
            </html>
            """
            
            params = {
                "from": FROM_EMAIL,
                "to": [to_email],
                "subject": f"Healio.AI {title}",
                "html": html_content
            }
            
            email = resend.Emails.send(params)
            print(f"✅ Reminder email sent to {to_email}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send reminder email: {str(e)}")
            return False
    
    @staticmethod
    async def send_health_tip(
        to_email: str,
        user_name: str,
        tip_title: str,
        tip_content: str
    ) -> bool:
        """Send daily health tip email"""
        try:
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: sans-serif; line-height: 1.6; color: #334155; max-width: 600px; 
                        margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                            padding: 25px; border-radius: 12px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">🌿 Daily Health Tip</h1>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 8px; margin-top: 20px;">
                    <p>Hi <strong>{user_name}</strong>,</p>
                    <h2 style="color: #0d9488; font-size: 20px;">{tip_title}</h2>
                    <p style="font-size: 16px; line-height: 1.8;">{tip_content}</p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://healio.ai/tips" style="color: #0d9488; text-decoration: none; font-weight: 600;">
                            Read More Health Tips →
                        </a>
                    </div>
                </div>
            </body>
            </html>
            """
            
            params = {
                "from": FROM_EMAIL,
                "to": [to_email],
                "subject": f"Your Daily Health Tip: {tip_title}",
                "html": html_content
            }
            
            email = resend.Emails.send(params)
            return True
            
        except Exception as e:
            print(f"❌ Failed to send health tip: {str(e)}")
            return False
