# =========================
# BUILD STAGE
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

# copy manifest
COPY package*.json ./

# install deps
RUN npm install

# copy source
COPY . .

# build nextjs
RUN npm run build


# =========================
# RUNTIME STAGE
# =========================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# copy only needed files
COPY package*.json ./
RUN npm install --production

# copy build result
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001

CMD ["npm", "run", "start"]
