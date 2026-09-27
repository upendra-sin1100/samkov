"""Conservative language screening; all accepted feedback remains private for review."""
import re
import unicodedata
from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID

BLOCKED = ('fuck', 'fucking', 'fucker', 'motherfucker', 'shit', 'bullshit', 'bitch',
           'asshole', 'bastard', 'cunt', 'dickhead', 'madarchod', 'behenchod',
           'bhenchod', 'chutiya', 'chutiye', 'gandu', 'gaand', 'harami')

def respectful_message(value):
    text = unicodedata.normalize('NFKC', value).casefold()
    text = ''.join(c for c in text if unicodedata.category(c) != 'Cf')
    text = text.translate(str.maketrans({'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','@':'a','$':'s'}))
    text = re.sub(r'(.)\1{2,}', r'\1\1', text)
    for word in BLOCKED:
        pattern = r'(?<!\w)' + r'[\W_]*'.join(re.escape(c) + '+' for c in word) + r'(?!\w)'
        if re.search(pattern, text):
            raise ValueError('Please remove abusive language and describe your experience respectfully. Critical feedback is welcome.')
    if re.search(r'\b(kill yourself|go die|i will kill you)\b', text):
        raise ValueError('Please remove threats or abusive language. Critical feedback is welcome.')
    return value

class FeedbackInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    application_id: UUID
    rating: int = Field(strict=True, ge=1, le=5)
    message: str = Field(min_length=10, max_length=2000)
