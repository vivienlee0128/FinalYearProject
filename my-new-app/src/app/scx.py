import requests

TOKEN_URL = "https://www.qwickly.tools/api/auth/token/"
UPLOAD_URL = "https://www.qwickly.tools/api/dashboard/v1/upload/"

client_id = 'e4aaToBaYUhSyvM1lYwiuboY0QQwmRmBtYwGvJ0a'
client_secret = 'gVeLeYuuWTohHplPtoXgaw36nsim93XgQ78Mi2GXH5CP7YnFwwRpeSonD2yJplLmVbtbva0Q6XJuJMHu7jIrejnSBdpnBTP5CxzdrRUT7rCilhV1ykI39MOYjLllFTpE'

# Obtain token (OAuth2 client_credentials)
token_resp = requests.post(
    TOKEN_URL,
    headers={"Content-Type": "application/x-www-form-urlencoded"},
    data={
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
    },
    timeout=30,
)

print(token_resp.json())