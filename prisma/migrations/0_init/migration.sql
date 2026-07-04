-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "salePrice" INTEGER,
    "monthlyRent" INTEGER,
    "displayPrice" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "areaSqft" INTEGER NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "images" TEXT[],
    "features" TEXT[],
    "description" TEXT NOT NULL,
    "tag" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "leadScore" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_preferences" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "city" TEXT,
    "area" TEXT,
    "propertyType" TEXT,
    "purpose" TEXT,
    "saleBudget" INTEGER,
    "rentBudget" INTEGER,
    "bedrooms" INTEGER,
    "size" TEXT,
    "timeline" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "matchedIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_properties" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posted_property_drafts" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "city" TEXT NOT NULL,
    "area" TEXT,
    "purpose" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "expectedPrice" TEXT,
    "monthlyRent" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "posted_property_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "properties_city_purpose_propertyType_idx" ON "properties"("city", "purpose", "propertyType");

-- CreateIndex
CREATE UNIQUE INDEX "leads_sessionId_key" ON "leads"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "lead_preferences_conversationId_key" ON "lead_preferences"("conversationId");

-- CreateIndex
CREATE INDEX "conversations_leadId_idx" ON "conversations"("leadId");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_properties_leadId_propertyId_key" ON "saved_properties"("leadId", "propertyId");

-- CreateIndex
CREATE INDEX "posted_property_drafts_sessionId_idx" ON "posted_property_drafts"("sessionId");

-- AddForeignKey
ALTER TABLE "lead_preferences" ADD CONSTRAINT "lead_preferences_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_properties" ADD CONSTRAINT "saved_properties_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_properties" ADD CONSTRAINT "saved_properties_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

