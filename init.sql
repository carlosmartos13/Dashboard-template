-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'FINANCEIRO', 'SUPORTE', 'ATENDENTE', 'REGISTRADO');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "password" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "role" "Role" NOT NULL DEFAULT 'REGISTRADO',
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEmailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorAppEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "twoFactorBackupCodes" TEXT,
    "emailTwoFactorCode" TEXT,
    "emailTwoFactorExpires" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "integracao_conta_azul" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresIn" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "empresaId" INTEGER NOT NULL,

    CONSTRAINT "integracao_conta_azul_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conta_azul_clientes" (
    "id" TEXT NOT NULL,
    "caId" TEXT NOT NULL,
    "idLegado" INTEGER,
    "uuidLegado" TEXT,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "tipoPessoa" TEXT,
    "perfis" TEXT[],
    "observacoes" TEXT,
    "dataCriacaoCA" TIMESTAMP(3),
    "dataAlteracaoCA" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contratoId" TEXT,
    "contratoStatus" TEXT,
    "contratoNumero" INTEGER,
    "contratoInicio" TIMESTAMP(3),
    "contratoVencimento" TIMESTAMP(3),
    "empresaId" INTEGER NOT NULL,

    CONSTRAINT "conta_azul_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conta_azul_recebimentos" (
    "id" TEXT NOT NULL,
    "id_ca_receber" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "Venda_CA" TEXT NOT NULL,
    "data_vencimento" TIMESTAMP(3) NOT NULL,
    "Venda_Status" TEXT NOT NULL,
    "Venda_A_Receber" DOUBLE PRECISION NOT NULL,
    "Venda_Pago" DOUBLE PRECISION NOT NULL,
    "Venda_dtCriacao" TIMESTAMP(3) NOT NULL,
    "Venda_DtUpdate" TIMESTAMP(3) NOT NULL,
    "client_id" TEXT NOT NULL,
    "client_nome" TEXT NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conta_azul_recebimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdv_integrations" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "accessToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pdv_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdv_licenca_grupos" (
    "id" SERIAL NOT NULL,
    "codGrupo" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "ativo" BOOLEAN NOT NULL,
    "produto" TEXT,
    "qtdLojasAtivas" INTEGER NOT NULL,
    "qtdLojasDesativadas" INTEGER NOT NULL,
    "dataCadastroApi" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pdv_licenca_grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdv_licenca_filiais" (
    "id" SERIAL NOT NULL,
    "sistema" TEXT DEFAULT 'PDVLEGAL',
    "codGrupo" INTEGER NOT NULL,
    "codFilial" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "ativo" BOOLEAN NOT NULL,
    "matriz" BOOLEAN NOT NULL,
    "email" TEXT,
    "dataCadastroApi" TIMESTAMP(3),
    "grupoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pdv_licenca_filiais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "cnpj" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "email" TEXT,
    "cep" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "integracao_conta_azul_empresaId_key" ON "integracao_conta_azul"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "conta_azul_clientes_caId_key" ON "conta_azul_clientes"("caId");

-- CreateIndex
CREATE UNIQUE INDEX "conta_azul_clientes_contratoId_key" ON "conta_azul_clientes"("contratoId");

-- CreateIndex
CREATE UNIQUE INDEX "conta_azul_recebimentos_id_ca_receber_key" ON "conta_azul_recebimentos"("id_ca_receber");

-- CreateIndex
CREATE UNIQUE INDEX "pdv_licenca_grupos_codGrupo_key" ON "pdv_licenca_grupos"("codGrupo");

-- CreateIndex
CREATE UNIQUE INDEX "pdv_licenca_filiais_codFilial_key" ON "pdv_licenca_filiais"("codFilial");

-- CreateIndex
CREATE UNIQUE INDEX "companies_cnpj_key" ON "companies"("cnpj");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integracao_conta_azul" ADD CONSTRAINT "integracao_conta_azul_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conta_azul_clientes" ADD CONSTRAINT "conta_azul_clientes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conta_azul_recebimentos" ADD CONSTRAINT "conta_azul_recebimentos_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "conta_azul_clientes"("caId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conta_azul_recebimentos" ADD CONSTRAINT "conta_azul_recebimentos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdv_licenca_filiais" ADD CONSTRAINT "pdv_licenca_filiais_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "pdv_licenca_grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Garante que a extensão para IDs aleatórios exista
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Insere o usuário Admin Master
INSERT INTO "User" (id, name, email, password, role, image) 
VALUES (
  'admin-master-id', 
  'Admin Master', 
  'suporte@seatec.com.br', 
  '$2a$10$76.Z9kYp7BpjZ/U.UvK3p.FIn8yvXf2uLwS3mRjH7lG.Fp8Iu8Iu.', 
  'SUPER_ADMIN', 
  '/images/avatars/1.png'
)
ON CONFLICT (email) DO NOTHING;
