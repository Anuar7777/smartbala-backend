# ---------- STAGE 1: BUILD ----------
FROM node:22.20.0 AS builder

WORKDIR /app

# Install all dependencies (including Prisma + Nest CLI)
COPY package*.json ./
RUN npm ci

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client (for type safety during build)
RUN npx prisma generate

# Copy source code
COPY . .

# Build NestJS 
RUN npm run build


# ---------- STAGE 2: PRODUCTION ----------
FROM node:22.20.0 AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client in prod image
RUN npx prisma generate

# Copy compiled code
COPY --from=builder /app/dist ./dist

# Copy environment
COPY .env .env

EXPOSE 5000

CMD ["node", "dist/src/main.js"]
