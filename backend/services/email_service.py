import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587


def send_temp_password_email(to_email: str, user_name: str, temp_password: str):
    SMTP_USER = os.environ.get("SMTP_EMAIL", "")
    SMTP_PASS = os.environ.get("SMTP_PASSWORD", "")
    if not SMTP_USER or not SMTP_PASS or SMTP_USER == "your_gmail@gmail.com":
        raise Exception("Email not configured. Add SMTP_EMAIL and SMTP_PASSWORD to .env")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "LedgerLink - Your Temporary Password"
    msg["From"] = f"LedgerLink <{SMTP_USER}>"
    msg["To"] = to_email

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #2563eb; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">LedgerLink</h1>
      </div>
      <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
        <p style="color: #374151; font-size: 15px;">Hi <strong>{user_name}</strong>,</p>
        <p style="color: #374151; font-size: 15px;">Your password reset request was received. Use the temporary password below to log in:</p>
        <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
          <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0;">TEMPORARY PASSWORD</p>
          <p style="color: #111827; font-size: 22px; font-weight: bold; letter-spacing: 2px; margin: 0;">{temp_password}</p>
        </div>
        <p style="color: #ef4444; font-size: 13px;">Please change your password after logging in.</p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">If you did not request this, please contact your administrator immediately.</p>
      </div>
    </div>
    """

    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, to_email, msg.as_string())
