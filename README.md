````markdown
# 📊 Dashboard BI - VoeCRM

Este projeto é um Dashboard Financeiro desenvolvido com **Next.js (Template Vuexy)**, integrado via API com a **Conta Azul** para gestão de recebimentos, utilizando **PostgreSQL** e **Prisma ORM**.

---

## 🚀 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

- **Node.js** (Versão 18 ou superior recomenda-se LTS)
- **Git**
- **PostgreSQL** (Versão mais recente)
- **Ngrok** (Para tunelamento da API em desenvolvimento)

---

## 🛠️ Passo a Passo de Instalação

### 1. Instalação do Banco de Dados (PostgreSQL)

1.  Baixe e instale a última versão do PostgreSQL para seu sistema operacional: [Download PostgreSQL](https://www.postgresql.org/download/).
2.  Durante a instalação, defina a senha do usuário `postgres` (ex: `root` ou outra de sua preferência).
3.  Abra o **pgAdmin** (ou terminal) e crie um banco de dados vazio chamado `VoeCRM`.

### 2. Configuração do Ngrok

Como a API da Conta Azul exige um callback HTTPS válido, usamos o Ngrok para expor o localhost.

1.  Crie uma conta e baixe o [Ngrok](https://ngrok.com/download).
2.  Configure seu token de autenticação (comando disponível no painel do Ngrok).
3.  Se você possui um domínio fixo no Ngrok, inicie o túnel com o comando abaixo. Caso contrário, rode sem o domínio e atualize o `.env` depois.

```bash
# Substitua pelo seu domínio fixo se tiver
ngrok http --domain=supersensibly-unintromittive-beth.ngrok-free.dev 3000
```
````

> **Nota:** Mantenha o terminal do Ngrok aberto enquanto desenvolve.

### 3. Clonar o Repositório

Abra seu terminal na pasta onde deseja salvar o projeto:

```bash
git clone [https://github.com/carlosmartos13/Dashboard-BI.git](https://github.com/carlosmartos13/Dashboard-BI.git)
cd Dashboard-BI

```

### 4. Configuração das Variáveis de Ambiente (.env)

1. Duplique o arquivo `.env.example` (se existir) ou crie um arquivo chamado `.env` na raiz do projeto.
2. Cole a configuração abaixo, ajustando a senha do banco e o domínio do Ngrok se necessário:

```env
# -----------------------------------------------------------------------------
# ⚙️ CONFIGURAÇÃO PRINCIPAL (Altere apenas aqui!)
# -----------------------------------------------------------------------------
# Cole aqui a URL HTTPS que o Ngrok gerou para você
NEXT_PUBLIC_SERVER_HOST=[https://supersensibly-unintromittive-beth.ngrok-free.dev](https://supersensibly-unintromittive-beth.ngrok-free.dev)

# Se for usar subpasta no futuro. Se for raiz, deixe vazio.
BASEPATH=

# -----------------------------------------------------------------------------
# App (Configuração Automática - Não alterar)
# -----------------------------------------------------------------------------
NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_SERVER_HOST}${BASEPATH}
NEXT_PUBLIC_DOCS_URL=[https://demos.pixinvent.com/vuexy-nextjs-admin-template/documentation](https://demos.pixinvent.com/vuexy-nextjs-admin-template/documentation)

# -----------------------------------------------------------------------------
# Authentication (NextAuth.js)
# -----------------------------------------------------------------------------
NEXTAUTH_BASEPATH=${BASEPATH}/api/auth
NEXTAUTH_URL=${NEXT_PUBLIC_SERVER_HOST}${BASEPATH}/api/auth
NEXTAUTH_SECRET=sua-chave-secreta-aqui

# Google OAuth 2.0 (Opcional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# -----------------------------------------------------------------------------
# Database
# -----------------------------------------------------------------------------
# Ajuste 'postgres:senha' conforme sua instalação local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/voecrm?schema=public"

# -----------------------------------------------------------------------------
# API
# -----------------------------------------------------------------------------
API_URL=${NEXT_PUBLIC_SERVER_HOST}${BASEPATH}/api
NEXT_PUBLIC_API_URL=${API_URL}

# -----------------------------------------------------------------------------
# Mapbox (Opcional)
# -----------------------------------------------------------------------------
MAPBOX_ACCESS_TOKEN=

```

### 5. Instalar Dependências

Agora que o ambiente está configurado, instale as bibliotecas do projeto:

```bash
npm install
# ou
yarn install

```

### 6. Configurar o Banco de Dados (Prisma Migrate)

Este comando criará as tabelas no PostgreSQL com base no arquivo `schema.prisma`:

```bash
npx prisma migrate dev --name init_novo_pc

```

_(Opcional) Se houver dados iniciais configurados:_

```bash
npx prisma db seed

```

---

## ▶️ Rodando o Projeto

### Ambiente de Desenvolvimento

Para iniciar o servidor local com _Hot Reload_:

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev

```

O projeto estará acessível em: `http://localhost:3000` (ou através do link do Ngrok).

### Ambiente de Produção (Deploy)

Para gerar a versão otimizada e rodar em produção:

```bash
# 1. Gerar o build
npm run build

# 2. Iniciar o servidor de produção
npm start

```

---

## ⚠️ Checklist de Troubleshooting

- **Erro de Conexão Conta Azul?** Verifique se o link no `NEXT_PUBLIC_SERVER_HOST` (.env) é exatamente o mesmo que está rodando no terminal do Ngrok.
- **Erro de Banco de Dados?** Verifique se o serviço do PostgreSQL está rodando e se as credenciais na `DATABASE_URL` estão corretas.
- **Callback Inválido?** Lembre-se de atualizar a URL de Redirecionamento no painel de desenvolvedor da Conta Azul sempre que o link do Ngrok mudar.

```

```
