-- CreateTable
CREATE TABLE "ImageAnalysis" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageAnalysisId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "hasHelmet" BOOLEAN NOT NULL DEFAULT false,
    "helmetColor" TEXT,
    "hasJacket" BOOLEAN NOT NULL DEFAULT false,
    "jacketColor" TEXT,
    "hasBoots" BOOLEAN NOT NULL DEFAULT false,
    "bootsColor" TEXT,
    "hasGloves" BOOLEAN NOT NULL DEFAULT false,
    "glovesColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_personId_key" ON "Equipment"("personId");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_imageAnalysisId_fkey" FOREIGN KEY ("imageAnalysisId") REFERENCES "ImageAnalysis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
