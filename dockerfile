# Install dependencies only when needed
FROM node:20.11-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm install; \
  elif [ -f yarn.lock ]; then yarn install; \
  else npm install; \
  fi

# Rebuild the source code only when needed
FROM node:20.11-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY next.config.* ./
COPY tsconfig.json ./
RUN npm run build

# Production image, copy all the files and run next
FROM node:20.11-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy built assets and node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3000

CMD [ "npm", "start" ]