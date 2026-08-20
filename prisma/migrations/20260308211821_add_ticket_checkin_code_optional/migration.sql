/*
  Warnings:

  - A unique constraint covering the columns `[checkInCode]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "checkInCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_checkInCode_key" ON "Ticket"("checkInCode");
