# jsxjp

## Official site

[jsx.jp](https://jsx.jp)

## linting

```
npm run lint --if-present
```

## testing

```
npm test
```

## debugging

```
npm start
```

## example container
```
git clone https://github.com/jobscale/jsxjp.git
cd jsxjp
main() {
  delayOpen() {
    sleep 3
    xdg-open http://127.0.0.1:3000
  }
  docker build . -t local/jsxjp
  delayOpen &
  docker run --rm --name jsxjp -p 3000:3000 -it local/jsxjp
} && main
```
