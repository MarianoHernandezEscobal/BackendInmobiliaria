FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx nest build

EXPOSE 3000

CMD ["node", "dist/main.js"]
