/*
  Warnings:

  - You are about to drop the column `flower_name_guess` on the `Response` table. All the data in the column will be lost.
  - Made the column `papaya_seed_guess` on table `Response` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Response" DROP COLUMN "flower_name_guess",
ALTER COLUMN "papaya_seed_guess" SET NOT NULL;
