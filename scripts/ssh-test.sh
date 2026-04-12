#!/usr/bin/env bash
set -eu

# Kill any lingering node processes
pkill -9 node npm 2>/dev/null || true
sleep 2

echo "Testing SSH server on 127.0.0.1:22"
ssh 127.0.0.1 -p 22 echo healthy || {
  echo "Failed to connect to SSH server"
  exit 1
}

# serve ws over http server and kill it on exit
npm start &
PID=$!
finaly() {
  kill $PID 2>/dev/null || true
  pkill -f 'node index.js'
}
trap finaly EXIT

sleep 3
sudo ss -tunlp | grep :3000 || {
  echo "no binding on port 3000"
}

echo "Testing ws server on 127.0.0.1:3000"
nc -vz -w 1 127.0.0.1 3000 || {
  echo "Failed to connect to ws server"
  exit 1
}

# test ssh connection
ssh -o "ProxyCommand client.js ws://127.0.0.1:3000/ssh %h %p" x.a.jsx.jp -p 22 echo "hello $(date +%7N)"
ssh -o "ProxyCommand client.js ws://127.0.0.1:3000/ssh %h %p" y.a.jsx.jp -p 22 echo "hello $(date +%7N)"
ssh -o "ProxyCommand client.js ws://127.0.0.1:3000/ssh %h %p" z.a.jsx.jp -p 22 echo "hello $(date +%7N)"
ssh -o "ProxyCommand client.js ws://127.0.0.1:3000/ssh %h %p" us.jsx.jp -p 22 echo "hello $(date +%7N)"
echo "SSH connection test passed"
