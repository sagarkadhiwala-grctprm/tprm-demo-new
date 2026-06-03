-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "dataTypes" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "employeeCount" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "tierRationale" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_assessment',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "questions" TEXT NOT NULL,
    "responses" TEXT NOT NULL,
    "scores" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "aiNarrative" TEXT NOT NULL,
    "keyFindings" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'completed',
    CONSTRAINT "Assessment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
