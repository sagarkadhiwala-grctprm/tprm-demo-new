-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN "natureOfBusiness" TEXT;
ALTER TABLE "Vendor" ADD COLUMN "productsServices" TEXT;
ALTER TABLE "Vendor" ADD COLUMN "dataCategories" TEXT;
ALTER TABLE "Vendor" ADD COLUMN "dataVolume" TEXT;
ALTER TABLE "Vendor" ADD COLUMN "dataRetentionPeriod" TEXT;
ALTER TABLE "Vendor" ADD COLUMN "geographicPresence" TEXT;
ALTER TABLE "Vendor" ADD COLUMN "certifications" TEXT;
ALTER TABLE "Vendor" ADD COLUMN "regulatoryBodies" TEXT;
ALTER TABLE "Vendor" ADD COLUMN "inherentLikelihood" INTEGER;
ALTER TABLE "Vendor" ADD COLUMN "inherentImpact" INTEGER;
ALTER TABLE "Vendor" ADD COLUMN "inherentRiskScore" INTEGER;
ALTER TABLE "Vendor" ADD COLUMN "inherentRiskRating" TEXT;

-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN "controlEffectivenessScore" INTEGER;
ALTER TABLE "Assessment" ADD COLUMN "residualLikelihood" INTEGER;
ALTER TABLE "Assessment" ADD COLUMN "residualImpact" INTEGER;
ALTER TABLE "Assessment" ADD COLUMN "residualRiskScore" INTEGER;
ALTER TABLE "Assessment" ADD COLUMN "residualRiskRating" TEXT;
ALTER TABLE "Assessment" ADD COLUMN "risksIdentified" INTEGER;
ALTER TABLE "Assessment" ADD COLUMN "criticalRisks" INTEGER;
ALTER TABLE "Assessment" ADD COLUMN "highRisks" INTEGER;
ALTER TABLE "Assessment" ADD COLUMN "mediumRisks" INTEGER;
ALTER TABLE "Assessment" ADD COLUMN "lowRisks" INTEGER;
ALTER TABLE "Assessment" ADD COLUMN "approvalStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "Assessment" ADD COLUMN "approvalNotes" TEXT;
ALTER TABLE "Assessment" ADD COLUMN "approvedBy" TEXT;
ALTER TABLE "Assessment" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "Assessment" ADD COLUMN "documentAnalysis" TEXT;

-- CreateTable
CREATE TABLE "VendorDocument" (
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

-- AddForeignKey
ALTER TABLE "VendorDocument" ADD CONSTRAINT "VendorDocument_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
