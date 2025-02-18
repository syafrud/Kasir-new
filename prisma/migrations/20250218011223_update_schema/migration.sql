-- CreateTable
CREATE TABLE "stok_management" (
    "id" SERIAL NOT NULL,
    "id_produk" INTEGER NOT NULL,
    "stockIN" INTEGER NOT NULL,
    "stockOut" INTEGER NOT NULL,

    CONSTRAINT "stok_management_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "stok_management" ADD CONSTRAINT "stok_management_id_produk_fkey" FOREIGN KEY ("id_produk") REFERENCES "produk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
