-- AlterTable
ALTER TABLE `detail_penjualan` ADD COLUMN `event_produkId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `detail_penjualan` ADD CONSTRAINT `detail_penjualan_event_produkId_fkey` FOREIGN KEY (`event_produkId`) REFERENCES `event_produk`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
