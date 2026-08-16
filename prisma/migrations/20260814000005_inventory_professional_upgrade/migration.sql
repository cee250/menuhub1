-- Professional inventory upgrade. This migration is intentionally additive.
-- It is safe to run after the base inventory migration or after `prisma db push`.

ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "supplierId" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "sku" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "reorderQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "lastCountedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "InventoryItem_businessId_supplierId_idx"
  ON "InventoryItem"("businessId", "supplierId");
CREATE INDEX IF NOT EXISTS "InventoryItem_businessId_sku_idx"
  ON "InventoryItem"("businessId", "sku");

CREATE TABLE IF NOT EXISTS "InventorySettings" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "inventoryMode" TEXT NOT NULL DEFAULT 'SIMPLE',
  "reservationMode" TEXT NOT NULL DEFAULT 'ON_ORDER',
  "reservationExpiryMinutes" INTEGER NOT NULL DEFAULT 30,
  "autoHideOutOfStock" BOOLEAN NOT NULL DEFAULT true,
  "lowStockNotifications" BOOLEAN NOT NULL DEFAULT true,
  "defaultUnit" TEXT NOT NULL DEFAULT 'piece',
  "managerCanRestock" BOOLEAN NOT NULL DEFAULT true,
  "managerCanAdjust" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventorySettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InventorySupplier" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventorySupplier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InventoryCount" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "note" TEXT,
  "createdById" TEXT,
  "completedById" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryCount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InventoryCountLine" (
  "id" TEXT NOT NULL,
  "countId" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "expectedQuantity" DOUBLE PRECISION NOT NULL,
  "countedQuantity" DOUBLE PRECISION,
  "variance" DOUBLE PRECISION,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryCountLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "InventorySettings_businessId_key"
  ON "InventorySettings"("businessId");
CREATE INDEX IF NOT EXISTS "InventorySupplier_businessId_name_idx"
  ON "InventorySupplier"("businessId", "name");
CREATE INDEX IF NOT EXISTS "InventoryCount_businessId_status_idx"
  ON "InventoryCount"("businessId", "status");
CREATE INDEX IF NOT EXISTS "InventoryCount_businessId_createdAt_idx"
  ON "InventoryCount"("businessId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "InventoryCountLine_countId_inventoryItemId_key"
  ON "InventoryCountLine"("countId", "inventoryItemId");
CREATE INDEX IF NOT EXISTS "InventoryCountLine_inventoryItemId_idx"
  ON "InventoryCountLine"("inventoryItemId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InventoryItem_supplierId_fkey') THEN
    ALTER TABLE "InventoryItem"
      ADD CONSTRAINT "InventoryItem_supplierId_fkey"
      FOREIGN KEY ("supplierId") REFERENCES "InventorySupplier"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InventorySettings_businessId_fkey') THEN
    ALTER TABLE "InventorySettings"
      ADD CONSTRAINT "InventorySettings_businessId_fkey"
      FOREIGN KEY ("businessId") REFERENCES "Business"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InventorySupplier_businessId_fkey') THEN
    ALTER TABLE "InventorySupplier"
      ADD CONSTRAINT "InventorySupplier_businessId_fkey"
      FOREIGN KEY ("businessId") REFERENCES "Business"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InventoryCount_businessId_fkey') THEN
    ALTER TABLE "InventoryCount"
      ADD CONSTRAINT "InventoryCount_businessId_fkey"
      FOREIGN KEY ("businessId") REFERENCES "Business"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InventoryCountLine_countId_fkey') THEN
    ALTER TABLE "InventoryCountLine"
      ADD CONSTRAINT "InventoryCountLine_countId_fkey"
      FOREIGN KEY ("countId") REFERENCES "InventoryCount"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InventoryCountLine_inventoryItemId_fkey') THEN
    ALTER TABLE "InventoryCountLine"
      ADD CONSTRAINT "InventoryCountLine_inventoryItemId_fkey"
      FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
