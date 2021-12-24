FROM node:lts-alpine3.12

WORKDIR /opt/deployment-service/

COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 8080

CMD ["node", "."]
