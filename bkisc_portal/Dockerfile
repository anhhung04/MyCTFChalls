FROM  openresty/openresty:1.21.4.2-1-alpine-apk  
WORKDIR /app

COPY requirements.txt .

RUN apk add --update --no-cache \
    sed \
    g++ \
    python3 \
    python3-dev \
    build-base \
    linux-headers \
    py3-pip \
    && pip install -I --no-cache-dir -r /app/requirements.txt
COPY src .
RUN sed -i "s/REDACTED/$(head -c 100 /dev/urandom | tr -dc 'a-zA-Z')/g" /app/schema.sql
COPY conf .
RUN mv /app/app.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["sh", "/app/start.sh"]