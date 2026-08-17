-- Non-destructive unified food-and-drinks inventory upgrade.
-- Safe to apply after the existing inventory migrations or with `prisma db push`.

ALTER TABLE "InventorySettings" ALTER COLUMN "autoHideOutOfStock" SET DEFAULT false;

ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "inventoryCategory" TEXT NOT NULL DEFAULT 'OTHER';
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "sellingPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "packSize" DOUBLE PRECISION NOT NULL DEFAULT 1;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "reorderEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "isPerishable" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "InventoryMovement" ADD COLUMN IF NOT EXISTS "movementCategory" TEXT NOT NULL DEFAULT 'OTHER';
ALTER TABLE "InventoryMovement" ADD COLUMN IF NOT EXISTS "costValue" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "InventoryMovement" ADD COLUMN IF NOT EXISTS "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "InventoryMovement" ADD COLUMN IF NOT EXISTS "periodKey" TEXT;
ALTER TABLE "InventoryMovement" ADD COLUMN IF NOT EXISTS "eventName" TEXT;
ALTER TABLE "InventoryMovement" ADD COLUMN IF NOT EXISTS "comment" TEXT;
ALTER TABLE "InventoryMovement" ADD COLUMN IF NOT EXISTS "inventoryPeriodId" TEXT;

CREATE TABLE IF NOT EXISTS "InventoryPeriod" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "monthKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP(3),
  "openedById" TEXT,
  "closedById" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryPeriod_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InventoryDailyClose" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "periodId" TEXT NOT NULL,
  "closeDate" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "systemValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "physicalValue" DOUBLE PRECISION,
  "varianceValue" DOUBLE PRECISION,
  "notes" TEXT,
  "createdById" TEXT,
  "approvedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP(3),
  CONSTRAINT "InventoryDailyClose_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InventoryDailyCloseLine" (
  "id" TEXT NOT NULL,
  "dailyCloseId" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "systemQuantity" DOUBLE PRECISION NOT NULL,
  "physicalQuantity" DOUBLE PRECISION,
  "variance" DOUBLE PRECISION,
  "notes" TEXT,
  CONSTRAINT "InventoryDailyCloseLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "InventoryPeriod_businessId_monthKey_key"
  ON "InventoryPeriod"("businessId", "monthKey");
CREATE INDEX IF NOT EXISTS "InventoryPeriod_businessId_status_idx"
  ON "InventoryPeriod"("businessId", "status");
CREATE INDEX IF NOT EXISTS "InventoryMovement_businessId_movementCategory_createdAt_idx"
  ON "InventoryMovement"("businessId", "movementCategory", "createdAt");
CREATE INDEX IF NOT EXISTS "InventoryMovement_businessId_periodKey_idx"
  ON "InventoryMovement"("businessId", "periodKey");
CREATE UNIQUE INDEX IF NOT EXISTS "InventoryDailyClose_businessId_closeDate_key"
  ON "InventoryDailyClose"("businessId", "closeDate");
CREATE INDEX IF NOT EXISTS "InventoryDailyClose_businessId_periodId_idx"
  ON "InventoryDailyClose"("businessId", "periodId");
CREATE UNIQUE INDEX IF NOT EXISTS "InventoryDailyCloseLine_dailyCloseId_inventoryItemId_key"
  ON "InventoryDailyCloseLine"("dailyCloseId", "inventoryItemId");
CREATE INDEX IF NOT EXISTS "InventoryDailyCloseLine_inventoryItemId_idx"
  ON "InventoryDailyCloseLine"("inventoryItemId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InventoryMovement_inventoryPeriodId_fkey') THEN
    ALTER TABLE "InventoryMovement"
      ADD CONSTRAINT "InventoryMovement_inventoryPeriodId_fkey"
      FOREIGN KEY ("inventoryPeriodId") REFERENCES "InventoryPeriod"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InventoryPeriod_businessId_fkey') THEN
    ALTER TABLE "InventoryPeriod"
      ADD CONSTRAINT "InventoryPeriod_businessId_fkey"
      FOREIGN KEY ("businessId") REFERENCES "Business"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InventoryDailyClose_businessId_fkey') THEN
    ALTER TABLE "InventoryDailyClose"
      ADD CONSTRAINT "InventoryDailyClose_businessId_fkey"
      FOREIGN KEY ("businessId") REFERENCES "Business"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InventoryDailyClose_periodId_fkey') THEN
    ALTER TABLE "InventoryDailyClose"
      ADD CONSTRAINT "InventoryDailyClose_periodId_fkey"
      FOREIGN KEY ("periodId") REFERENCES "InventoryPeriod"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InventoryDailyCloseLine_dailyCloseId_fkey') THEN
    ALTER TABLE "InventoryDailyCloseLine"
      ADD CONSTRAINT "InventoryDailyCloseLine_dailyCloseId_fkey"
      FOREIGN KEY ("dailyCloseId") REFERENCES "InventoryDailyClose"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InventoryDailyCloseLine_inventoryItemId_fkey') THEN
    ALTER TABLE "InventoryDailyCloseLine"
      ADD CONSTRAINT "InventoryDailyCloseLine_inventoryItemId_fkey"
      FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
