"use client";

import { useState, useEffect } from "react";
import { Plus, Minus, Info, Search } from "lucide-react";
import Image from "next/image";
import { adjustStock } from "@/app/api/produk/actions";
import toast from "react-hot-toast";

interface Product {
  id: number;
  nama_produk: string;
  harga_jual: number;
  stok: number;
  barcode: number;
  image?: string;
}

export default function StockAdjustmentPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [adjustmentValue, setAdjustmentValue] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [adjustmentType, setAdjustmentType] = useState<"in" | "out">("in");
  const [totalCount, setTotalCount] = useState(0);

  const handleAdjustmentTypeChange = (value: "in" | "out") => {
    setAdjustmentType(value);
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, pageSize]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(
        (product) =>
          product.nama_produk
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (product.barcode && product.barcode.toString().includes(searchTerm))
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(
        `/api/produk?page=${currentPage}&limit=${pageSize}`
      );
      const data = await response.json();

      setProducts(data.produk);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Gagal memuat data produk");
    }
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setAdjustmentValue(1);
  };

  const handleAdjustmentChange = (value: number) => {
    if (value >= 0) {
      setAdjustmentValue(value);
    }
  };

  const increaseAdjustment = () => {
    setAdjustmentValue((prev) => prev + 1);
  };

  const decreaseAdjustment = () => {
    if (adjustmentValue > 0) {
      setAdjustmentValue((prev) => prev - 1);
    }
  };

  const handleSaveAdjustment = async (type: "in" | "out") => {
    if (!selectedProduct || adjustmentValue <= 0) {
      toast.error("Pilih produk dan masukkan jumlah yang valid");
      return;
    }

    try {
      await adjustStock({
        productId: selectedProduct.id,
        amount: adjustmentValue,
        type,
      });

      toast.success(
        `Stok berhasil ${type === "in" ? "ditambahkan" : "dikurangi"}`
      );

      fetchProducts();

      setSelectedProduct(null);
      setAdjustmentValue(1);
      setAdjustmentType("in");
    } catch (error) {
      console.error("Error adjusting stock:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Gagal menyimpan penyesuaian stok");
      }
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <div className="flex h-[calc(100vh-62px)] p-4">
      {/* Products List Column */}
      <div className="w-1/2 p-4 flex flex-col gap-4">
        <div className="flex flex-row">
          <div className="flex items-center">
            <select
              className="border p-2 rounded mr-2"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
          <div className="flex flex-grow items-center gap-4">
            <input
              type="text"
              placeholder="Cari..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="rounded-lg bg-white h-full p-4 flex flex-col">
          <div className="overflow-y-auto flex-grow max-h-[calc(100vh-280px)]">
            <table className="w-full ">
              <thead>
                <tr className="border-b-2">
                  <th className="p-2 text-left">Foto</th>
                  <th className="p-2 text-center">Barang</th>
                  <th className="p-2 text-right">Harga</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={`border-b cursor-pointer hover:bg-gray-100 text-center ${
                      selectedProduct?.id === product.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleSelectProduct(product)}
                  >
                    <td className="p-2">
                      <Image
                        src={product.image || "/placeholder.jpg"}
                        alt={product.nama_produk}
                        width={100}
                        height={100}
                        className="w-16 object-cover rounded-md"
                      />
                    </td>
                    <td className="p-2">
                      <div>{product.nama_produk}</div>
                      <div className="text-green-600">Stok: {product.stok}</div>
                    </td>
                    <td className="p-2 text-right">
                      Rp. {product.harga_jual.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
                products
              </span>
              <div>
                <button
                  className={`mr-2 px-3 py-1 border rounded ${
                    currentPage === 1
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="px-3 py-1 border rounded bg-blue-500 text-white">
                  {currentPage}
                </span>
                <button
                  className={`ml-2 px-3 py-1 border rounded ${
                    currentPage === totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Column */}
      <div className="w-1/2 p-4">
        <div className="bg-white rounded-lg shadow-md p-6 h-full relative">
          <h2 className="text-xl font-semibold mb-6">Detail Barang</h2>

          {selectedProduct ? (
            <div className=" h-max">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Nama Barang
                  </label>
                  <div className="p-2 border rounded bg-gray-50">
                    {selectedProduct.nama_produk}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Adjustment
                </label>
                <div className="flex items-center gap-2">
                  <select
                    className="p-2 border rounded bg-gray-50"
                    value={adjustmentType}
                    onChange={(e) =>
                      handleAdjustmentTypeChange(e.target.value as "in" | "out")
                    }
                  >
                    <option value="in">+</option>
                    <option value="out">-</option>
                  </select>
                  <div className="flex border rounded">
                    <button
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200"
                      onClick={decreaseAdjustment}
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      value={adjustmentValue}
                      onChange={(e) =>
                        handleAdjustmentChange(parseInt(e.target.value))
                      }
                      className="w-16 text-center p-2 border-l border-r"
                      min="0"
                    />
                    <button
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200"
                      onClick={increaseAdjustment}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Stok Awal: {selectedProduct.stok}, Adjustment:{" "}
                  {adjustmentType === "in"
                    ? `+${adjustmentValue}`
                    : `-${adjustmentValue}`}
                  , Stok Akhir:{" "}
                  {adjustmentType === "in"
                    ? selectedProduct.stok + adjustmentValue
                    : selectedProduct.stok - adjustmentValue}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Tanggal Adjustment
                </label>
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  readOnly
                />
              </div>

              <div className="flex justify-end items-end absolute bottom-4 right-4">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded"
                  onClick={() => handleSaveAdjustment(adjustmentType)}
                >
                  Simpan
                </button>
              </div>
            </div>
          ) : (
            <div className="block">
              <div className="bg-[#D9F0D1] rounded-lg p-4 text-[#266d0e] text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={20} />
                  <span className="font-semibold">Petunjuk</span>
                </div>
                <ul className="list-disc pl-5">
                  <li className="list-item items-center gap-1">
                    <div className="flex items-center gap-1">
                      Untuk menampilkan detail barang silakan pilih Barang
                      penjualan disamping
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
