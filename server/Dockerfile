FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY src/ ./src/
RUN mkdir -p uploads/images uploads/videos
EXPOSE 80
CMD ["node", "src/app.js"]
