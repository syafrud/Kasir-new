/*
  Warnings:

  - Added the required column `harga_beli` to the `detail_penjualan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `detail_penjualan` ADD COLUMN `diskon` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `harga_beli` DECIMAL(65, 30) NOT NULL;
