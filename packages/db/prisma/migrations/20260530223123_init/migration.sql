-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "walletAddr" TEXT,
    "minUsd" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "explanation" TEXT,
    "riskFlag" TEXT,
    "riskReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "WatchRule_userId_isActive_idx" ON "WatchRule"("userId", "isActive");

-- CreateIndex
CREATE INDEX "Alert_userId_createdAt_idx" ON "Alert"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "WatchRule" ADD CONSTRAINT "WatchRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "WatchRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
