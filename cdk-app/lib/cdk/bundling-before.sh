export HOME=/tmp
export npm_config_cache=/tmp/.npm
echo "[ASSET INPUT]"
pwd
ls -la $(pwd)
cp -r . /asset-output
cd /asset-output
rm -fr node_modules package-lock.json __tests__
npm i --omit=dev
rm -fr package-lock.json
echo "[ASSET OUTPUT]"
echo "/asset-output"
ls -la /asset-output
