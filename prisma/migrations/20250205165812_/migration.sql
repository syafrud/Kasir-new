-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PETUGAS');

-- CreateTable
CREATE TABLE "detail_penjualan" (
    "id" SERIAL NOT NULL,
    "id_penjualan" INTEGER NOT NULL,
    "id_produk" INTEGER NOT NULL,
    "harga_jual" DECIMAL(65,30) NOT NULL,
    "qty" INTEGER NOT NULL,
    "total_harga" DECIMAL(65,30) NOT NULL,
    "tanggal_penjualan" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detail_penjualan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penjualan" (
    "id" SERIAL NOT NULL,
    "id_user" INTEGER NOT NULL,
    "id_pelanggan" INTEGER NOT NULL,
    "diskon" DECIMAL(65,30) NOT NULL,
    "total_harga" DECIMAL(65,30) NOT NULL,
    "tanggal_penjualan" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "penjualan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produk" (
    "id" SERIAL NOT NULL,
    "id_kategori" INTEGER NOT NULL,
    "nama_produk" TEXT NOT NULL,
    "harga_beli" DECIMAL(65,30) NOT NULL,
    "harga_jual" DECIMAL(65,30) NOT NULL,
    "stok" INTEGER NOT NULL,
    "barcode" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kategori" (
    "id" SERIAL NOT NULL,
    "nama_kategori" TEXT NOT NULL,

    CONSTRAINT "kategori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pelanggan" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "hp" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pelanggan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "nama_user" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "user_priv" "UserRole" NOT NULL DEFAULT 'PETUGAS',
    "alamat" TEXT NOT NULL,
    "hp" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pelanggan_nama_key" ON "pelanggan"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "detail_penjualan" ADD CONSTRAINT "detail_penjualan_id_penjualan_fkey" FOREIGN KEY ("id_penjualan") REFERENCES "penjualan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_penjualan" ADD CONSTRAINT "detail_penjualan_id_produk_fkey" FOREIGN KEY ("id_produk") REFERENCES "produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penjualan" ADD CONSTRAINT "penjualan_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penjualan" ADD CONSTRAINT "penjualan_id_pelanggan_fkey" FOREIGN KEY ("id_pelanggan") REFERENCES "pelanggan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk" ADD CONSTRAINT "produk_id_kategori_fkey" FOREIGN KEY ("id_kategori") REFERENCES "kategori"("id") ON DELETE CASCADE ON UPDATE CASCADE;
