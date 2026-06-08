-- Idempotent migration: safe to retry after a partial failure or db push drift

-- AlterTable Vendor
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "natureOfBusiness" TEXT;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "productsServices" TEXT;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "dataCategories" TEXT;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "dataVolume" TEXT;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "dataRetentionPeriod" TEXT;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "geographicPresence" TEXT;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "certifications" TEXT;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "regulatoryBodies" TEXT;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "inherentLikelihood" INTEGER;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "inherentImpact" INTEGER;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "inherentRiskScore" INTEGER;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "inherentRiskRating" TEXT;

-- AlterTable Assessment
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "controlEffectivenessScore" INTEGER;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "residualLikelihood" INTEGER;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "residualImpact" INTEGER;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "residualRiskScore" INTEGER;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "residualRiskRating" TEXT;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "risksIdentified" INTEGER;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "criticalRisks" INTEGER;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "highRisks" INTEGER;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "mediumRisks" INTEGER;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "lowRisks" INTEGER;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "approvalNotes" TEXT;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "documentAnalysis" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Assessment' AND column_name = 'approvalStatus'
  ) THEN
    ALTER TABLE "Assessment" ADD COLUMN "approvalStatus" TEXT NOT NULL DEFAULT 'pending';
  END IF;
END $$;

-- CreateTable VendorDocument
CREATE TABLE IF NOT EXISTS "VendorDocument" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "extractedText" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "aiAnalysis" TEXT,
    "overallRisk" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorDocument_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'VendorDocument_vendorId_fkey'
  ) THEN
    ALTER TABLE "VendorDocument"
      ADD CONSTRAINT "VendorDocument_vendorId_fkey"
      FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
