export HOME=/tmp
export npm_config_cache=/tmp/.npm
cp -r . /asset-output
cd /asset-output
rm -fr node_modules package-lock.json __tests__
npm i --omit=dev
