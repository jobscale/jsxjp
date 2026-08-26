FROM node:lts-trixie-slim AS test
SHELL ["bash", "-c"]
WORKDIR /home/node
USER node
COPY --chown=node:staff package.json .
RUN npm i
COPY --chown=node:staff cdk-app cdk-app
RUN rm -fr cdk-app/test cdk-app/lib/functions/test
RUN (cd cdk-app/lib/functions/proxy && npm i)
COPY --chown=node:staff index.js .
COPY --chown=node:staff eslint.config.js .
RUN npm run check:jest

FROM node:lts-trixie-slim
SHELL ["bash", "-c"]
WORKDIR /home/node
USER node
COPY --chown=node:staff package.json .
RUN npm i --omit=dev
COPY --chown=node:staff cdk-app cdk-app
RUN (cd cdk-app/lib/functions/proxy && npm i --omit=dev)
COPY --chown=node:staff index.js .
EXPOSE 3000
CMD ["npm", "start"]
