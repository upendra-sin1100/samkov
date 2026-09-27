"""Verify Clerk session tokens before resolving the internal student UUID."""
import asyncio
import os
from functools import lru_cache
from urllib.parse import urlparse
import jwt
from fastapi import HTTPException
from .db import profile_for_subject

@lru_cache(maxsize=4)
def jwks(issuer):
    parsed = urlparse(issuer)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.query or parsed.fragment:
        raise HTTPException(503,'Configure a valid Clerk issuer URL.')
    return jwt.PyJWKClient(issuer.rstrip('/')+'/.well-known/jwks.json', lifespan=300, timeout=10)

def verify_token(token):
    issuer = os.getenv('CLERK_ISSUER_URL','').rstrip('/')
    if not issuer: raise HTTPException(503,'Authentication has not been configured yet.')
    try:
        key = jwks(issuer).get_signing_key_from_jwt(token).key
        audience = os.getenv('CLERK_AUDIENCE') or None
        claims = jwt.decode(token,key,algorithms=['RS256'],issuer=issuer,audience=audience,
                            options={'require':['exp','iat','nbf','sub','iss'], 'verify_aud':bool(audience)},leeway=5)
        allowed = {x.strip().rstrip('/') for x in os.getenv('CLERK_AUTHORIZED_PARTIES',os.getenv('NEXT_PUBLIC_SITE_URL','http://localhost:3000')).split(',')}
        if claims.get('azp') not in allowed or not isinstance(claims['sub'],str) or not claims['sub'].startswith('user_'):
            raise jwt.InvalidTokenError('Invalid session origin or subject.')
        return claims
    except jwt.PyJWKClientConnectionError as exc:
        raise HTTPException(503,'Authentication temporarily unavailable.') from exc
    except jwt.PyJWTError as exc:
        raise HTTPException(401,'Your session has expired. Please sign in again.') from exc

async def identity(request):
    header = request.headers.get('authorization','')
    if not header.startswith('Bearer ') or len(header) < 15:
        raise HTTPException(401,'Sign in to continue.')
    claims = await asyncio.to_thread(verify_token,header[7:])
    profile = await asyncio.to_thread(profile_for_subject,claims['sub'])
    if profile['disabled']: raise HTTPException(403,'Account access is disabled.')
    return {'id':str(profile['id']),'auth_subject':claims['sub']}, profile['role']=='admin'
