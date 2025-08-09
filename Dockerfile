FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production --silent || true
COPY . .
EXPOSE 8080
CMD ["node","start.js"]
