### example deploy
```
git clone https://github.com/jobscale/jsxjp.git
cd jsxjp
main() {
  docker build . -t local/jsxjp
  docker run --rm --name jsxjp -p 80:80 -p 443:443 -d local/jsxjp
  sleep 0.5
  http_proxy= curl -sv http://127.0.0.1
  sleep 5.5
  http_proxy= curl -svk https://127.0.0.1
  docker stop jsxjp
} && main
```
