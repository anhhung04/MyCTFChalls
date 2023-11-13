FROM php:5.6-apache

WORKDIR /var/www/html
COPY src .

COPY str.sh /str.sh


COPY php.ini /usr/local/etc/php/

HEALTHCHECK CMD curl --fail http://localhost/index.php || exit 1
RUN chmod +x /str.sh && /str.sh && rm -f /str.sh
USER www-data

EXPOSE 80