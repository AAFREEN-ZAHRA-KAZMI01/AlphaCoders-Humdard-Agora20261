import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from ..core.config import get_settings

settings = get_settings()

_OTP_BODY = """\
Your HumDard verification code is:

    {code}

This code expires in 10 minutes. Do not share it with anyone.
"""


def _send_sync(to_email: str, subject: str, body: str) -> None:
    msg = MIMEMultipart()
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.EMAIL_FROM}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        if settings.SMTP_TLS:
            server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.EMAIL_FROM, to_email, msg.as_string())


async def send_otp_email(to_email: str, otp_code: str) -> None:
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        _send_sync,
        to_email,
        "Your HumDard verification code",
        _OTP_BODY.format(code=otp_code),
    )
