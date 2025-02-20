/*
  Warnings:

  - A unique constraint covering the columns `[barcode]` on the table `produk` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `produk_barcode_key` ON `produk`(`barcode`);
