#!/bin/sh
set -e

if [ ! -f /etc/nginx/certs/cert.pem ]; then
    apk add --no-cache openssl
    mkdir -p /etc/nginx/certs
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout /etc/nginx/certs/key.pem \
        -out /etc/nginx/certs/cert.pem \
        -subj "/CN=localhost"
fi

exec nginx -g 'daemon off;'
