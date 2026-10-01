# ---------------------------------------------------------------
# هاوڕێ — ایمیج Production چندمرحله‌ای
# مرحله ۱: نصب وابستگی‌ها | مرحله ۲: ساخت | مرحله ۳: اجرا (سبک)
# ---------------------------------------------------------------

# ---------- ۱) وابستگی‌ها ----------
FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

# ---------- ۲) ساخت ----------
FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# مقادیر ساختگی فقط برای عبور از مرحله build؛ مقادیر واقعی هنگام اجرا از env می‌آیند
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    DATABASE_URL="file:/app/data/dev.db" \
    AUTH_SECRET="build-time-placeholder-secret-32-chars-min"
RUN npx prisma generate && npm run build:next

# ---------- ۳) اجرا ----------
FROM node:20-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates tini \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs hawre

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# خروجی standalone نکست (شامل node_modules لازم)
COPY --from=builder --chown=hawre:nodejs /app/.next/standalone ./
COPY --from=builder --chown=hawre:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=hawre:nodejs /app/public ./public

# Prisma: schema، مهاجرت‌ها، CLI و seed برای اجرای migrate در استارت
COPY --from=builder --chown=hawre:nodejs /app/prisma ./prisma
COPY --from=builder --chown=hawre:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=hawre:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=hawre:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=hawre:nodejs /app/node_modules/.bin ./node_modules/.bin
COPY --chown=hawre:nodejs docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh && mkdir -p /app/data /app/public/uploads /app/public/seed \
    && chown -R hawre:nodejs /app/data /app/public

USER hawre
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--", "/app/entrypoint.sh"]
CMD ["node", "server.js"]
