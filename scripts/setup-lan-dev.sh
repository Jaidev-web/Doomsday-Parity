#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAN_IP="${1:-10.21.51.15}"
CERT_DIR="$ROOT_DIR/frontend/certs"

mkdir -p "$CERT_DIR" "$ROOT_DIR/frontend/public"

if [[ ! -s "$CERT_DIR/trusthire-lan-ca-key.pem" || ! -s "$CERT_DIR/trusthire-lan-ca.pem" ]]; then
  openssl genrsa -out "$CERT_DIR/trusthire-lan-ca-key.pem" 3072 >/dev/null 2>&1
  openssl req -x509 -new -nodes -key "$CERT_DIR/trusthire-lan-ca-key.pem" \
    -sha256 -days 825 -out "$CERT_DIR/trusthire-lan-ca.pem" \
    -subj '/CN=TrustHire Local Development CA' \
    -addext 'basicConstraints=critical,CA:TRUE' \
    -addext 'keyUsage=critical,keyCertSign,cRLSign' >/dev/null 2>&1
fi

openssl genrsa -out "$CERT_DIR/lan-key.pem" 2048 >/dev/null 2>&1
openssl req -new -key "$CERT_DIR/lan-key.pem" -out "$CERT_DIR/lan.csr" \
  -subj "/CN=$LAN_IP" >/dev/null 2>&1
cat > "$CERT_DIR/lan-ext.cnf" <<EOF
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=IP:$LAN_IP,DNS:localhost,IP:127.0.0.1
EOF
openssl x509 -req -in "$CERT_DIR/lan.csr" \
  -CA "$CERT_DIR/trusthire-lan-ca.pem" \
  -CAkey "$CERT_DIR/trusthire-lan-ca-key.pem" -CAcreateserial \
  -out "$CERT_DIR/lan-cert.pem" -days 397 -sha256 \
  -extfile "$CERT_DIR/lan-ext.cnf" >/dev/null 2>&1
cp "$CERT_DIR/trusthire-lan-ca.pem" "$ROOT_DIR/frontend/public/trusthire-lan-ca.crt"
rm -f "$CERT_DIR/lan.csr" "$CERT_DIR/lan-ext.cnf" "$CERT_DIR/trusthire-lan-ca.srl"

LAN_IP="$LAN_IP" FRONTEND_ENV="$ROOT_DIR/frontend/.env.local" BACKEND_ENV="$ROOT_DIR/backend/.env" python3 - <<'PY'
import os
import secrets
from pathlib import Path

lan_ip = os.environ["LAN_IP"]
frontend_env = Path(os.environ["FRONTEND_ENV"])
backend_env = Path(os.environ["BACKEND_ENV"])

def read_env(path):
    values = {}
    if path.exists():
        for line in path.read_text().splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                key, value = line.split("=", 1)
                values[key.strip()] = value.strip()
    return values

front = read_env(frontend_env)
back = read_env(backend_env)
front["NEXT_PUBLIC_API_BASE_URL"] = f"https://{lan_ip}:8000"
front["NEXT_PUBLIC_APP_URL"] = f"https://{lan_ip}:3000"
for key in ("MONGODB_URI", "MONGODB_DATABASE"):
    if key in back:
        front[key] = back[key]
front.setdefault("AUTH_OTP_SECRET", secrets.token_hex(32))
frontend_env.write_text("".join(f"{key}={value}\n" for key, value in front.items()))
frontend_env.chmod(0o600)
PY

LAN_IP="$LAN_IP" BACKEND_ENV="$ROOT_DIR/backend/.env" python3 - <<'PY'
import os
from pathlib import Path

path = Path(os.environ["BACKEND_ENV"])
ip = os.environ["LAN_IP"]
path.parent.mkdir(parents=True, exist_ok=True)
lines = path.read_text().splitlines() if path.exists() else []
origins = [
    "http://localhost:3000",
    "https://localhost:3000",
    f"http://{ip}:3000",
    f"https://{ip}:3000",
]
for index, line in enumerate(lines):
    if line.startswith("FRONTEND_ORIGINS="):
        current = [item.strip() for item in line.split("=", 1)[1].split(",") if item.strip()]
        lines[index] = "FRONTEND_ORIGINS=" + ",".join(dict.fromkeys(current + origins))
        break
else:
    lines.append("FRONTEND_ORIGINS=" + ",".join(origins))
path.write_text("\n".join(lines) + "\n")
PY

LAN_IP="$LAN_IP" NEXT_CONFIG="$ROOT_DIR/frontend/next.config.mjs" python3 - <<'PY'
import os
import re
from pathlib import Path

path = Path(os.environ["NEXT_CONFIG"])
source = path.read_text()
replacement = f"allowedDevOrigins: ['{os.environ['LAN_IP']}'],"
updated, count = re.subn(r"allowedDevOrigins:\s*\[[^\]]*\],", replacement, source)
if count:
    path.write_text(updated)
elif "const nextConfig = {" in source:
    path.write_text(source.replace("const nextConfig = {", f"const nextConfig = {{\n  {replacement}", 1))
PY

printf 'LAN development configuration is ready for %s.\n' "$LAN_IP"
printf 'Frontend URL: https://%s:3000\n' "$LAN_IP"
printf 'Backend URL:  https://%s:8000\n' "$LAN_IP"
printf 'Install frontend/public/trusthire-lan-ca.crt as a trusted certificate on the candidate device.\n'
