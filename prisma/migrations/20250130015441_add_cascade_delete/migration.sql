-- DropForeignKey
ALTER TABLE `produk` DROP FOREIGN KEY `produk_id_kategori_fkey`;

-- AlterTable
ALTER TABLE `users` MODIFY `user_priv` ENUM('ADMIN', 'PETUGAS') NOT NULL DEFAULT 'PETUGAS';

-- AddForeignKey
ALTER TABLE `produk` ADD CONSTRAINT `produk_id_kategori_fkey` FOREIGN KEY (`id_kategori`) REFERENCES `kategori`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
