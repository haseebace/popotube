FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install dependencies first for caching purposes
COPY package.json ./
RUN npm install

# Copy full source and build
COPY . .
ARG BACKEND_URL=http://backend:3001
ENV BACKEND_URL=${BACKEND_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production runner image
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary standalone files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# Next.js standalone entry file
CMD ["node", "server.js"]
