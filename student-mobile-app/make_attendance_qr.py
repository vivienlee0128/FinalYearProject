import json
import os
import sys
import urllib.parse
import urllib.request

import qrcode

BASE_URL = (
    "https://fyp-workflow.swin.click"
    "/webhook/fyp-demo-qr-issue"
)

def main():
    if len(sys.argv) < 2:
        print(
            "Usage: python make_attendance_qr.py CSS202"
        )
        return

    course_code = sys.argv[1].upper()

    secret = os.environ.get("FYP_ISSUE_KEY")

    if not secret:
        raise RuntimeError(
            "FYP_ISSUE_KEY environment variable is missing."
        )

    url = (
        BASE_URL
        + "?courseCode="
        + urllib.parse.quote(course_code)
    )

    request = urllib.request.Request(
        url,
        headers={
            "X-FYP-Issue-Key": secret,
            "User-Agent": "Mozilla/5.0 (attendance-qr-script)",
        }
    )

    with urllib.request.urlopen(
        request,
        timeout=15
    ) as response:
        payload = json.loads(
            response.read().decode("utf-8")
        )

    if payload.get("type") != "FYP_ATTENDANCE_DEMO":
        raise RuntimeError("Unexpected QR response")

    # Use compact JSON for the scanner.
    qr_text = json.dumps(
        {
            "type": payload["type"],
            "v": payload["v"],
            "sessionId": payload["sessionId"],
            "token": payload["token"]
        },
        separators=(",", ":")
    )

    image = qrcode.make(qr_text)

    filename = (
        f"{course_code}_attendance_qr.png"
    )

    image.save(filename)

    print("QR generated:", filename)
    print("Expires at:", payload["expiresAt"])

if __name__ == "__main__":
    main()