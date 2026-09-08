#!/usr/bin/env bash
# Runs once, while the Codespace is being built.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ Installing dependencies"
npm install --no-audit --no-fund

# A session signing key is the one variable Piasowo genuinely requires. It is
# generated here rather than asked for, so a fresh Codespace runs immediately.
# .env.local is gitignored, so this key never leaves the machine it is made on.
if [ ! -f .env.local ]; then
  echo "→ Creating .env.local with a generated AUTH_SECRET"
  {
    echo "# Generated when this Codespace was created. Not committed."
    echo "AUTH_SECRET=$(openssl rand -base64 32)"
    echo ""
    echo "# Leave APP_ORIGIN blank: Piasowo reads the address each request"
    echo "# arrives on, so the Google redirect URI is correct here automatically."
    echo "APP_ORIGIN="
    echo ""
    echo "# Google sign-in — open /setup/google in the running app for the exact"
    echo "# values to register, then paste the credentials here and restart."
    echo "GOOGLE_CLIENT_ID="
    echo "GOOGLE_CLIENT_SECRET="
    echo ""
    echo "# Email delivery. Without these, verification codes are printed to the"
    echo "# terminal below instead of being sent."
    echo "SMTP_HOST="
    echo "SMTP_PORT=587"
    echo "SMTP_USER="
    echo "SMTP_PASSWORD="
  } > .env.local
else
  echo "→ .env.local already exists, leaving it alone"
fi

echo "→ Ready"
