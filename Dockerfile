FROM node:alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install --production

# Install app source
COPY . .

FROM node:alpine

WORKDIR /app

# Create user in final image
RUN addgroup -S books && adduser -S books -G books

# Copy built app
COPY --from=build --chown=books:books /app /app

USER books

EXPOSE 3000

CMD ["npm", "start"]
