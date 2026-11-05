#!/bin/sh
set -e

mkdir -p /etc/nginx/certs

# Generar certificado autofirmado inicial si no existe certificado en el volumen
if [ ! -f /etc/nginx/certs/origin.crt ] || [ ! -f /etc/nginx/certs/origin.key ]; then
    echo "[NGINX] Certificado SSL no encontrado en /etc/nginx/certs. Generando certificado autofirmado de inicializacion..."
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout /etc/nginx/certs/origin.key \
        -out /etc/nginx/certs/origin.crt \
        -subj "/CN=mesafy.doicela.dev/O=Mesafy/C=EC"
    echo "[NGINX] Certificado autofirmado generado exitosamente. (Apto para modo Cloudflare Full)."
else
    echo "[NGINX] Certificado SSL detectado en /etc/nginx/certs."
fi

exec nginx -g "daemon off;"

