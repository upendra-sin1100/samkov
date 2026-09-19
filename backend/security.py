import hashlib
import hmac
import re
from urllib.parse import urlparse

def valid_signature(payload: bytes, signature: str, secret: str) -> bool:
    return bool(secret and re.fullmatch(r'[a-fA-F0-9]{64}', signature) and hmac.compare_digest(hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest(), signature.lower()))

def level_unlocked(index: int, total: int, approved: list[int]) -> bool:
    if index < 0 or index >= total:
        return False
    start = 0 if index < 2 else 2 if index < total - 2 else total - 2
    return all(i in approved for i in range(start))

def captured_payment(payment: dict, order_id: str) -> bool:
    return payment.get('order_id') == order_id and payment.get('amount') == 4900 and payment.get('currency') == 'INR' and payment.get('status') == 'captured'

def secure_url(value: str, hosts: set[str] | None = None) -> str:
    url = urlparse(value)
    if url.scheme != 'https' or not url.hostname or url.username or url.password or (hosts and url.hostname not in hosts):
        raise ValueError('Use a valid HTTPS URL from the requested service.')
    return value
