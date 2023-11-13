#!/bin/bash
set -e
echo "BKISC{https://www.youtube.com/watch?v=xvFZjo5PgG0}" >/flag.txt
gunicorn -w 8 --bind 0.0.0.0:8080 app:app &
nginx -g "daemon off;"
