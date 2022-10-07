FROM node:lts-buster-slim
SHELL ["bash", "-c"]
WORKDIR /home/node
USER node
COPY --chown=node:staff package.json package.json
RUN npm i --omit=dev && mv db.example db
COPY --chown=node:staff . .
CMD ["npm", "start"]
