-- CreateTable
CREATE TABLE `detail_penjualan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_penjualan` INTEGER NOT NULL,
    `id_produk` INTEGER NOT NULL,
    `harga_jual` DECIMAL(65, 30) NOT NULL,
    `qty` INTEGER NOT NULL,
    `total_harga` DECIMAL(65, 30) NOT NULL,
    `tanggal_penjualan` DATETIME(3) NOT NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `penjualan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_user` INTEGER NOT NULL,
    `id_pelanggan` INTEGER NULL,
    `diskon` DECIMAL(65, 30) NOT NULL,
    `total_harga` DECIMAL(65, 30) NOT NULL,
    `penyesuaian` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `total_bayar` DECIMAL(65, 30) NOT NULL,
    `kembalian` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `tanggal_penjualan` DATETIME(3) NOT NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `produk` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_kategori` INTEGER NOT NULL,
    `nama_produk` VARCHAR(191) NOT NULL,
    `harga_beli` DECIMAL(65, 30) NOT NULL,
    `harga_jual` DECIMAL(65, 30) NOT NULL,
    `stok` INTEGER NOT NULL,
    `image` VARCHAR(191) NOT NULL,
    `barcode` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `produk_barcode_key`(`barcode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stok_management` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_produk` INTEGER NOT NULL,
    `stockIN` INTEGER NOT NULL,
    `stockOut` INTEGER NOT NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kategori` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_kategori` VARCHAR(191) NOT NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pelanggan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `alamat` VARCHAR(191) NOT NULL,
    `hp` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `pelanggan_nama_key`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_user` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `user_priv` ENUM('ADMIN', 'PETUGAS') NOT NULL DEFAULT 'PETUGAS',
    `alamat` VARCHAR(191) NOT NULL,
    `hp` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `detail_penjualan` ADD CONSTRAINT `detail_penjualan_id_penjualan_fkey` FOREIGN KEY (`id_penjualan`) REFERENCES `penjualan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detail_penjualan` ADD CONSTRAINT `detail_penjualan_id_produk_fkey` FOREIGN KEY (`id_produk`) REFERENCES `produk`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penjualan` ADD CONSTRAINT `penjualan_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penjualan` ADD CONSTRAINT `penjualan_id_pelanggan_fkey` FOREIGN KEY (`id_pelanggan`) REFERENCES `pelanggan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `produk` ADD CONSTRAINT `produk_id_kategori_fkey` FOREIGN KEY (`id_kategori`) REFERENCES `kategori`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stok_management` ADD CONSTRAINT `stok_management_id_produk_fkey` FOREIGN KEY (`id_produk`) REFERENCES `produk`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
