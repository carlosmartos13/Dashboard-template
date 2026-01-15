# --- Estágio 1: Base ---
FROM node:25-alpine AS base

# Instalar dependências de sistema necessárias
RUN apk add --no-cache libc6-compat
WORKDIR /app

# --- Estágio 2: Dependências ---
FROM base AS deps
# Copia apenas os arquivos de configuração de pacotes
COPY package.json package-lock.json* ./

# IMPORTANTE: Adicionei --ignore-scripts
# Isso evita que o 'postinstall' rode agora (pois a pasta prisma ainda não existe aqui)
RUN npm ci --ignore-scripts

# --- Estágio 3: Builder (Construção) ---
FROM base AS builder
WORKDIR /app

# Copia as dependências instaladas no estágio anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desabilita telemetria
ENV NEXT_TELEMETRY_DISABLED=1

# --- CORREÇÃO AQUI ---
# Agora que copiamos todos os arquivos (COPY . .), podemos rodar os comandos
# que falharam anteriormente:
RUN npx prisma generate
RUN npm run build:icons

# Constrói o projeto
RUN npm run build

# --- Estágio 4: Runner (Produção) ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Configura permissões
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copia o build otimizado
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
