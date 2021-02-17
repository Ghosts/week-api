FROM node:12-alpine as build

WORKDIR /app
COPY package.json /app/package.json
RUN yarn
COPY . /app
RUN yarn build

FROM node:12-alpine
WORKDIR /app
COPY --from=build /app/dist /app
COPY package.json /app/package.json
RUN yarn

EXPOSE 5000
CMD ["yarn", "start"]
