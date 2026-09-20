"""Production entry point: Railway supplies PORT; local default is 8000."""
import os
import uvicorn

if __name__ == '__main__':
    uvicorn.run('backend.main:app', host='0.0.0.0', port=int(os.getenv('PORT', '8000')))
