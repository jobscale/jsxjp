FROM node:lts-trixie-slim AS test
SHELL ["bash", "-c"]
WORKDIR /home/node
USER node
COPY --chown=node:staff package.json .
RUN npm i
COPY --chown=node:staff docs docs
COPY --chown=node:staff views views
COPY --chown=node:staff app app
COPY --chown=node:staff index.js .
COPY --chown=node:staff eslint.config.js .
COPY --chown=node:staff test test
RUN npm test

FROM node:lts-trixie-slim
SHELL ["bash", "-c"]
WORKDIR /home/node
USER node
COPY --chown=node:staff package.json .
RUN npm i --omit=dev
COPY --chown=node:staff docs docs
COPY --chown=node:staff views views
COPY --chown=node:staff app app
COPY --chown=node:staff index.js .
EXPOSE 3000
CMD ["npm", "start"]
