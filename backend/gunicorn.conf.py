import multiprocessing
import os

# Bind to host and port
bind = "0.0.0.0:5000"

# Number of worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "gthread"  # Threaded workers handle concurrent requests well
threads = 2                # Threads per worker
worker_connections = 1000
timeout = 120              # 2 minutes timeout
keepalive = 5

# Logging
accesslog = "-"  # stdout
errorlog = "-"   # stdout
loglevel = "info"

# Process name
proc_name = "robinhood_tracker"

# Preload app for faster workers
preload_app = True

# Hooks
def when_ready(server):
    print("✅ Gunicorn server is ready and listening")

def on_exit(server):
    print("🛑 Gunicorn server is shutting down")