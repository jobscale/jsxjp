FROM node:lts-buster-slim
SHELL ["bash", "-c"]
WORKDIR /home/node
USER node
COPY --chown=node:staff package.json package.json
RUN npm i --omit=dev
COPY --chown=node:staff . .
RUN mv db.example db
CMD ["npm", "start"]
