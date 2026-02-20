-- AlterTable
ALTER TABLE "client_sites" ADD COLUMN     "name" TEXT;

-- Backfill: set name to hostname extracted from wpUrl for existing rows
UPDATE "client_sites" SET "name" = regexp_replace("wpUrl", '^https?://([^/]+).*$', '\1') WHERE "name" IS NULL;
