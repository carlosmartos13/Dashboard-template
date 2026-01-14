# --- Estágio 1: Instalação das dependências (Base) ---
FROM node:25 AS base

# Instalar dependências necessárias para o Alpine (libc6-compat)
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar apenas os arquivos de dependência primeiro (para aproveitar o cache do Docker)
COPY package.json package-lock.json* ./

# Instalar dependências
RUN npm ci

# --- Estágio 2: Construção (Builder) ---
FROM base AS builder
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .

# Desabilitar telemetria do Next.js durante o build (opcional, mas recomendado)
ENV NEXT_TELEMETRY_DISABLED 1

# Construir o projeto
RUN npm run build

# --- Estágio 3: Execução (Runner) ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Criar usuário e grupo para segurança (não rodar como root)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar os arquivos públicos e o build otimizado do estágio anterior
COPY --from=builder /app/public ./public

# Configurar permissões para o cache de imagens do Next.js
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copiar a saída 'standalone' que configuramos no Passo 1
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Mudar para o usuário não-root
USER nextjs

# Expor a porta que o container vai usar
EXPOSE 3000

ENV PORT 3000
# Comando para iniciar a aplicação
CMD ["node", "server.js"]
