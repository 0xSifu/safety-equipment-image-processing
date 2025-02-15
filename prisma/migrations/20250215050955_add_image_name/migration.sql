/*
  Warnings:

  - Added the required column `imageName` to the `ImageAnalysis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ImageAnalysis" ADD COLUMN     "imageName" TEXT NOT NULL,
ALTER COLUMN "imageUrl" DROP NOT NULL;
