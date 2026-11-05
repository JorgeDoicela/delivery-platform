FROM nginx:alpine

RUN apk add --no-cache openssl curl

COPY docker/nginx/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY docker/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD curl -f http://127.0.0.1/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
