-- CreateIndex
CREATE UNIQUE INDEX "client_sites_clientId_wpUrl_key" ON "client_sites"("clientId", "wpUrl");
