"""Generate a fresh five-minute FYP demo QR image from the n8n issuer.
Install once: py -m pip install 'qrcode[pil]'
Usage: py make_demo_qr.py https://YOUR-N8N-HOST/webhook/fyp-demo-qr-issue CSS301
"""
import json
import sys
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

try:
    import qrcode
except ImportError:
    raise SystemExit("Install the QR library first: py -m pip install 'qrcode[pil]'")

if len(sys.argv) < 2:
    raise SystemExit('Usage: py make_demo_qr.py https://HOST/webhook/fyp-demo-qr-issue [CSS301]')

url = sys.argv[1].rstrip('/')
course = sys.argv[2] if len(sys.argv) > 2 else 'CSS301'
if not url.startswith('https://'):
    raise SystemExit('Use the HTTPS production webhook URL.')
with urlopen(url + '?' + urlencode({'courseCode': course}), timeout=15) as response:
    data = json.load(response)
if not data.get('ok') or not isinstance(data.get('qrText'), str):
    raise SystemExit('n8n did not issue a demo QR: ' + repr(data))
path = Path('fyp-demo-qr.png')
qrcode.make(data['qrText']).save(path)
print('Created:', path.resolve())
print('Unit:', data.get('courseCode'))
print('Expires:', data.get('expiresAt'))
print('Display the PNG on another screen and scan it with the Android app before expiry.')
