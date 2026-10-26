#!/bin/sh
# Holt die neueste Version und startet das Dashboard neu.
set -e
cd "$(dirname "$0")"
git pull
docker compose up -d --build
echo "Fertig – Seite auf dem Tablet neu laden."
