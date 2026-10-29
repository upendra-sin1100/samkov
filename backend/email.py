"""Transactional email delivery for program notifications."""
import logging
import json
import os
import smtplib
from email.message import EmailMessage
from email.utils import parseaddr
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

logger = logging.getLogger(__name__)


class EmailConfigurationError(RuntimeError):
    """Raised when transactional email settings are incomplete."""


class EmailDeliveryError(RuntimeError):
    """Raised when the configured mail server rejects delivery."""


def _send_via_brevo(message: EmailMessage, *, error_message: str) -> None:
    api_key = os.getenv('BREVO_API_KEY', '').strip()
    _, sender_email = parseaddr(message['From'])
    _, recipient_email = parseaddr(message['To'])
    payload = {
        'sender': {'name': 'SamkovAI Program Office', 'email': sender_email},
        'to': [{'email': recipient_email}],
        'subject': message['Subject'],
        'textContent': message.get_content(),
    }
    request = Request(
        'https://api.brevo.com/v3/smtp/email',
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'api-key': api_key,
            'content-type': 'application/json',
            'accept': 'application/json',
        },
        method='POST',
    )
    try:
        with urlopen(request, timeout=15):
            return
    except HTTPError as exc:
        response_body = exc.read().decode('utf-8', errors='replace')
        logger.error('Brevo API returned HTTP %s: %s', exc.code, response_body)
        raise EmailDeliveryError(error_message) from exc
    except (URLError, OSError) as exc:
        logger.exception('Brevo API request failed')
        raise EmailDeliveryError(error_message) from exc


def _send_message(message: EmailMessage, *, error_message: str) -> None:
    if os.getenv('BREVO_API_KEY', '').strip():
        return _send_via_brevo(message, error_message=error_message)

    host = os.getenv('EMAIL_HOST', 'smtp.gmail.com').strip()
    username = os.getenv('EMAIL_USERNAME', '').strip()
    password = os.getenv('EMAIL_PASSWORD', '').replace(' ', '')
    sender = os.getenv('EMAIL_FROM', username).strip()
    try:
        port = int(os.getenv('EMAIL_PORT', '587'))
    except ValueError as exc:
        raise EmailConfigurationError('EMAIL_PORT must be a valid port number.') from exc

    if not username or not password or not sender:
        raise EmailConfigurationError(
            'Email is not configured. Set EMAIL_USERNAME, EMAIL_PASSWORD to a Google App Password, '
            'and EMAIL_FROM.'
        )

    use_ssl = os.getenv('EMAIL_USE_SSL', '').strip().lower() in {'1', 'true', 'yes'}
    if not os.getenv('EMAIL_USE_SSL') and port == 465:
        use_ssl = True

    try:
        smtp_class = smtplib.SMTP_SSL if use_ssl else smtplib.SMTP
        with smtp_class(host, port, timeout=15) as smtp:
            if not use_ssl:
                smtp.starttls()
            smtp.login(username, password)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        logger.exception('SMTP send failed')
        raise EmailDeliveryError(error_message) from exc


def send_offer_email(*, recipient: str, student_name: str, track_name: str,
                     offer_id: str, offer_url: str) -> None:
    username = os.getenv('EMAIL_USERNAME', '').strip()
    sender = os.getenv('EMAIL_FROM', username).strip()
    if not recipient:
        raise EmailConfigurationError(
            'No verified primary email is saved for this learner. Enter an email address and try again.'
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
    _send_message(message, error_message='The offer email could not be delivered.')


def send_internship_email(*, recipient: str, student_name: str, track_name: str,
                          workspace_url: str) -> None:
    """Send an internship reminder / welcome-back email to an active intern."""
    username = os.getenv('EMAIL_USERNAME', '').strip()
    sender = os.getenv('EMAIL_FROM', username).strip()
    if not recipient:
        raise EmailConfigurationError(
            'No verified primary email is saved for this learner. Enter an email address and try again.'
        )

    message = EmailMessage()
    message['Subject'] = f'Your SamkovAI internship — {track_name}'
    message['From'] = sender
    message['To'] = recipient
    message.set_content(
        f"""Hello {student_name},

This is a reminder about your active SamkovAI internship in the {track_name} program.

Open your workspace to continue where you left off, submit your projects and take the next step in your learning journey.

Your workspace:
{workspace_url}

SamkovAI Program Office
"""
    )
    _send_message(message, error_message='The internship reminder email could not be delivered.')


def send_certificate_email(*, recipient: str, student_name: str, track_name: str,
                           certificate_id: str, certificate_url: str) -> None:
    """Notify a learner when their verified completion certificate is issued."""
    username = os.getenv('EMAIL_USERNAME', '').strip()
    sender = os.getenv('EMAIL_FROM', username).strip()
    if not recipient:
        raise EmailConfigurationError(
            'No verified primary email is saved for this learner. Enter an email address and try again.'
        )

    message = EmailMessage()
    message['Subject'] = 'Your SamkovAI certificate is ready'
    message['From'] = sender
    message['To'] = recipient
    message.set_content(
        f"""Hello {student_name},

Congratulations! Your verified certificate for the {track_name} program is now available.

View your certificate:
{certificate_url}

Certificate ID: {certificate_id}

SamkovAI Program Office
"""
    )
    _send_message(message, error_message='The certificate email could not be delivered.')
