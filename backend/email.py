"""Transactional email delivery for program notifications."""
import os
import smtplib
from email.message import EmailMessage


class EmailConfigurationError(RuntimeError):
    """Raised when transactional email settings are incomplete."""


class EmailDeliveryError(RuntimeError):
    """Raised when the configured mail server rejects delivery."""


def send_offer_email(*, recipient: str, student_name: str, track_name: str,
                     offer_id: str, offer_url: str) -> None:
    host = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
    username = os.getenv('EMAIL_USERNAME', '').strip()
    password = os.getenv('EMAIL_PASSWORD', '')
    sender = os.getenv('EMAIL_FROM', username).strip()
    if not recipient:
        raise EmailConfigurationError('The learner does not have a verified email address.')
    if not username or not password or not sender:
        raise EmailConfigurationError(
            'Email is not configured. Set EMAIL_USERNAME, EMAIL_PASSWORD, and EMAIL_FROM.'
        )

    message = EmailMessage()
    message['Subject'] = 'Your SamkovAI offer letter'
    message['From'] = sender
    message['To'] = recipient
    message.set_content(
        f"""Hello {student_name},

Your application for the {track_name} virtual internship program has been approved.

View your offer letter:
{offer_url}

Offer ID: {offer_id}

SamkovAI Program Office
"""
    )
    try:
        with smtplib.SMTP(host, int(os.getenv('EMAIL_PORT', '587')), timeout=20) as smtp:
            smtp.starttls()
            smtp.login(username, password)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        raise EmailDeliveryError('The offer email could not be delivered.') from exc
