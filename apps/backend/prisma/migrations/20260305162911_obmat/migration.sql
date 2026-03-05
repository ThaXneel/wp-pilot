-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'system',
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "activities_clientId_idx" ON "activities"("clientId");

-- CreateIndex
CREATE INDEX "activities_siteId_idx" ON "activities"("siteId");

-- CreateIndex
CREATE INDEX "activities_createdAt_idx" ON "activities"("createdAt");

-- CreateIndex
CREATE INDEX "client_sites_clientId_idx" ON "client_sites"("clientId");

-- CreateIndex
CREATE INDEX "connect_tokens_clientId_idx" ON "connect_tokens"("clientId");

-- CreateIndex
CREATE INDEX "global_events_siteId_idx" ON "global_events"("siteId");

-- CreateIndex
CREATE INDEX "global_events_createdAt_idx" ON "global_events"("createdAt");
