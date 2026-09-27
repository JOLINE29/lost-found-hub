FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
RUN npm run build
EXPOSE 8080
CMD ["npm", "start"]
