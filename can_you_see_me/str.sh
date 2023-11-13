#!/bin/sh
echo "BKISC{https://www.youtube.com/watch?v=xvFZjo5PgG0}" >/var/www/html/pages/flag.txt
echo "BKISC{'Oh_g0d!!!!_You_Found_m3'}" >/var/log/flag_$(head -c 50 /dev/urandom | tr -dc 'a-zA-Z0-9').txt
