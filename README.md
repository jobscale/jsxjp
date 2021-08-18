### example deploy
```
git clone https://github.com/jobscale/jsxjp.git
cd jsxjp
main() {
  delayOpen() {
    sleep 3
    xdg-open http://127.0.0.1:3000
  }
  delayOpen &
  docker build . -t local/jsxjp
  docker run --rm --name jsxjp -p 3000:3000 -it local/jsxjp
} && main
```
