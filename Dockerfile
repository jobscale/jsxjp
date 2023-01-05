FROM node:lts-bullseye-slim
SHELL ["bash", "-c"]
WORKDIR /home/node
USER node
COPY --chown=node:staff package.json .
RUN npm i --omit=dev
COPY --chown=node:staff  db.example db
COPY --chown=node:staff  config config
COPY --chown=node:staff  docs docs
COPY --chown=node:staff  app app
COPY --chown=node:staff  index.js .
EXPOSE 3000
CMD ["npm", "start"]
