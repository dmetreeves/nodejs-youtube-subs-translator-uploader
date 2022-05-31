FROM node:14.15.1-alpine3.12

WORKDIR /app

COPY src/package.json package.json

RUN npm install
