# Local test server for the headless runs: threaded, with a long listen queue so many test
# browsers loading ~200 module files at once are not refused (plain `python -m http.server`
# keeps a queue of 5). Run from the site folder:  python tools/serve.py [port]
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class Server(ThreadingHTTPServer):
    request_queue_size = 256
    daemon_threads = True


class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
Server(('127.0.0.1', port), partial(Quiet, directory='.')).serve_forever()
