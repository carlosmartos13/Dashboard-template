#!/bin/sh
set -e

# 1. Gera o Prisma Client (garante que os binários sejam compatíveis com o Linux do container)
# Isso é importante pois o 'output' no seu schema.prisma é customizado (../src/generated/prisma)
echo "📦 Gerando Prisma Client..."
npx prisma generate

# 2. Aplica as migrações pendentes no banco de dados
# Usamos 'migrate deploy' pois é o comando seguro para ambientes sem interatividade (CI/CD/Docker)
# Se for apenas DEV e você quiser resetar sempre, poderia ser outro comando, mas 'deploy' é o padrão robusto.
echo "🚀 Aplicando Migrations..."
npx prisma migrate deploy

# 3. Executa o seed/criação de admin (Garante que o usuário inicial exista)
echo "🌱 Verificando usuário Admin..."
npx --yes tsx create-admin.ts

# 4. Executa o comando original do container (ex: npm run dev ou npm start)
echo "🏁 Iniciando a aplicação..."
exec "$@"
