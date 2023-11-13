FROM php:7.4-fpm-alpine

RUN apk add nginx supervisor sqlite-dev && \
    docker-php-ext-install pdo pdo_sqlite && \
    adduser -D www

COPY config/fpm.conf /usr/local/etc/php-fpm.conf
COPY config/supervisord.conf /etc/supervisord.conf
COPY config/nginx.conf /etc/nginx/nginx.conf

WORKDIR /www
COPY src .
COPY str.sh /str.sh
RUN chmod +x /str.sh && /str.sh && rm -f /str.sh
RUN chown -R www:www /www /var/lib/nginx

EXPOSE 80

COPY clean_up /etc/cron.d/

RUN chmod 0644 /etc/cron.d/clean_up

COPY cron.sh /bin/cron.sh

RUN chmod 554 /bin/cron.sh

RUN crontab /etc/cron.d/clean_up

CMD ["/usr/bin/supervisord","-c","/etc/supervisord.conf"]