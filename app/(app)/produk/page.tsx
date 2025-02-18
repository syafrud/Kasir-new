"use client";

import { useState, useEffect } from "react";
import {
  createProduk,
  updateProduk,
  deleteProduk,
  adjustStock,
} from "@/app/api/produk/actions";
import SearchBar from "@/components/search";
import toast from "react-hot-toast";
import { Plus, ArrowUp, ArrowDown } from "lucide-react";

interface Produk {
  id: number;
  id_kategori: number;
  kategori: { nama_kategori: string };
  nama_produk: string;
  harga_beli: string;
  harga_jual: string;
  stok: string;
  stok_tersisa: string;
  barcode: string;
}

interface Kategori {
  id: number;
  nama_kategori: string;
}

interface PaginationData {
  produkWithUpdatedStock: Produk[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export default function ProdukPage() {
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Produk | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState({
    amount: 0,
    type: "in" as "in" | "out",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [produks, setProduk] = useState<Produk[]>([]);
  const [kategoriOptions, setKategoriOptions] = useState<Kategori[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editProduk, setEditProduk] = useState<Produk | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama_produk: "",
    id_kategori: "",
    harga_beli: "",
    harga_jual: "",
    stok: "",
    barcode: "",
  });

  const handleStockAdjust = (produk: Produk, type: "in" | "out") => {
    setSelectedProduct(produk);
    setStockAdjustment({ amount: 0, type });
    setIsStockModalOpen(true);
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      await adjustStock({
        productId: selectedProduct.id,
        amount: stockAdjustment.amount,
        type: stockAdjustment.type,
      });

      toast.success(
        `Stock ${
          stockAdjustment.type === "in" ? "added" : "reduced"
        } successfully`
      );
      fetchProduk();
    } catch (error) {
      toast.error("Failed to adjust stock");
    }

    setIsStockModalOpen(false);
  };

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [produkToDelete, setProdukToDelete] = useState<number | null>(null);

  const fetchProduk = async () => {
    try {
      const res = await fetch(
        `/api/produk?search=${encodeURIComponent(
          search
        )}&page=${currentPage}&limit=${itemsPerPage}`
      );
      if (!res.ok) {
        const errorText = await res.text();
        setError(errorText || "Failed to fetch produks");
        return;
      }

      const data: PaginationData = await res.json();
      setProduk(data.produkWithUpdatedStock);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  useEffect(() => {
    fetchProduk();
  }, [search, currentPage, itemsPerPage]);

  useEffect(() => {
    const fetchKategori = async () => {
      try {
        const response = await fetch("/api/produk/kategori");
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setKategoriOptions(data);
        } else {
          console.error("Kategori data is not an array:", data);
          setKategoriOptions([]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setKategoriOptions([]);
      }
    };

    fetchKategori();
  }, []);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newLimit = parseInt(e.target.value);
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(startIndex + itemsPerPage - 1, totalCount);

  const handleEdit = (produk: Produk) => {
    setIsEditing(true);
    setEditProduk(produk);
    setFormData({
      nama_produk: produk.nama_produk,
      id_kategori: produk.id_kategori.toString(),
      harga_beli: produk.harga_beli,
      harga_jual: produk.harga_jual,
      stok: produk.stok,
      barcode: produk.barcode,
    });
    setIsModalOpen(true);
  };

  const openConfirmModal = (id: number) => {
    setProdukToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (produkToDelete === null) return;

    try {
      await deleteProduk(produkToDelete);
      fetchProduk();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Terjadi kesalahan saat menghapus data");
      }
    } finally {
      setIsConfirmOpen(false);
      setProdukToDelete(null);
      toast.success("Data berhasil dihapus");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      submitData.append(key, value);
    });

    if (isEditing && editProduk) {
      await updateProduk(submitData, editProduk.id);
      toast.success("Data berhasil diperbarui");
    } else {
      await createProduk(submitData);
      toast.success("Data berhasil ditambahkan");
    }
    fetchProduk();
    setIsModalOpen(false);
    setIsEditing(false);
    setEditProduk(null);
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setEditProduk(null);
    setIsModalOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-4">Produk Management</h1>

      <div className="flex flex-row gap-5 items-center text-center mb-3">
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Show</span>

          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="border rounded px-2 py-1 focus:outline-none focus:ring focus:ring-green-300"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
          <span className="text-gray-600">entries</span>
        </div>

        <SearchBar search={search} setSearch={setSearch} />

        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-green-500 text-white px-3 my-1 py-1 rounded-lg hover:bg-green-600 transition"
        >
          <Plus size={20} />
          Add New
        </button>
      </div>

      <table className="border-collapse border border-gray-200 mt-6">
        <thead>
          <tr>
            <th className="border p-2">NO</th>
            <th className="border p-2 w-1/6">Nama Produk</th>
            <th className="border p-2 w-1/6">kategori</th>
            <th className="border p-2 w-1/6">Harga Beli</th>
            <th className="border p-2 w-1/6">Harga Jual</th>
            <th className="border p-2 w-1/6">Stok</th>
            <th className="border p-2 w-1/6">barcode</th>
            <th className="border py-2 px-16 w-52">Actions</th>
            <th className="border p-2 w-1/6">Stock Management</th>
          </tr>
        </thead>
        <tbody>
          {produks.map((produk, index) => (
            <tr key={produk.id}>
              <td className="border p-2 text-center">{index + 1}</td>
              <td className="border p-2">{produk.nama_produk}</td>
              <td className="border p-2">{produk.kategori?.nama_kategori}</td>
              <td className="border p-2 text-center">{produk.harga_beli}</td>
              <td className="border p-2">{produk.harga_jual}</td>
              <td className="border p-2 text-right">{produk.stok_tersisa}</td>
              <td className="border p-2 text-center">{produk.barcode}</td>
              <td className="flex flex-row border gap-3 p-3">
                <button
                  onClick={() => handleEdit(produk)}
                  className="w-1/2 bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => openConfirmModal(produk.id)}
                  className="w-1/2 bg-red-500 text-white px-4 py-2 rounded"
                >
                  Delete
                </button>
              </td>
              <td className="border p-2 flex gap-2 justify-center">
                <button
                  onClick={() => handleStockAdjust(produk, "in")}
                  className="bg-green-500 text-white p-2 rounded"
                  title="Add Stock"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={() => handleStockAdjust(produk, "out")}
                  className="bg-red-500 text-white p-2 rounded"
                  title="Reduce Stock"
                >
                  <ArrowDown size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center mt-4">
        <div>
          Showing {totalCount > 0 ? startIndex : 0} to {endIndex} of{" "}
          {totalCount} entries
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 border rounded ${
              currentPage === 1 ? "bg-gray-100" : "hover:bg-gray-100"
            }`}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 border rounded ${
                currentPage === page
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 border rounded ${
              currentPage === totalPages ? "bg-gray-100" : "hover:bg-gray-100"
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal Create/Update*/}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "Edit Produk" : "Add New Produk"}
            </h2>
            <form
              onSubmit={handleFormSubmit}
              className="w-full sm:min-w-[400px] grid grid-cols-2 gap-3"
            >
              <div className="grid col-span-1 w-full min-w-sm">
                <div className="w-full min-w-sm items-center">
                  <label className="block text-base font-medium text-gray-700">
                    Nama Produk
                  </label>
                  <input
                    type="text"
                    name="nama_produk"
                    placeholder="Nama Produk"
                    className="border p-2 rounded w-full mt-2"
                    value={formData.nama_produk}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="w-full min-w-sm items-center gap-2">
                  <label className="block text-base font-medium text-gray-700">
                    Kategori
                  </label>
                  <select
                    name="id_kategori"
                    className="border p-2 rounded w-full mt-2"
                    value={formData.id_kategori}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>
                      Pilih Kategori
                    </option>
                    {Array.isArray(kategoriOptions) &&
                      kategoriOptions.map((kategori) => (
                        <option key={kategori.id} value={kategori.id}>
                          {kategori.nama_kategori}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="w-full min-w-sm items-center">
                  <label className="block text-base font-medium text-gray-700">
                    Harga Beli
                  </label>
                  <input
                    type="number"
                    name="harga_beli"
                    placeholder="Harga Beli"
                    className="border p-2 rounded w-full mt-2"
                    step="0.01"
                    value={formData.harga_beli}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid col-span-1 grid-cols-1 w-full min-w-sm">
                <div className="grid col-span-1 w-full min-w-sm items-center">
                  <label className="block text-base font-medium text-gray-700">
                    Harga Jual
                  </label>
                  <input
                    type="number"
                    name="harga_jual"
                    placeholder="Harga Jual"
                    className="border p-2 rounded w-full mt-2"
                    step="0.01"
                    value={formData.harga_jual}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid col-span-1 w-full min-w-sm items-center">
                  <label className="block text-base font-medium text-gray-700">
                    Stok Barang
                  </label>
                  <input
                    type="number"
                    name="stok"
                    placeholder="Stok Barang"
                    className="border p-2 rounded w-full mt-2"
                    value={formData.stok}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid col-span-1 w-full min-w-sm items-center">
                  <label className="block text-base font-medium text-gray-700">
                    Barcode
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    placeholder="Barcode"
                    className="border p-2 rounded w-full mt-2"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded mt-3"
              >
                {isEditing ? "Update" : "Add"}
              </button>
              <button
                type="button"
                onClick={handleModalClose}
                className="bg-gray-300 text-black px-4 py-2 rounded mt-3 ml-2"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete*/}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <p className="text-lg font-medium mb-4">
              Apakah Anda yakin ingin menghapus data ini?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmDelete}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Hapus
              </button>
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isStockModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              {stockAdjustment.type === "in" ? "Add Stock" : "Reduce Stock"} -{" "}
              {selectedProduct.nama_produk}
            </h2>
            <form onSubmit={handleStockSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current Stock: {selectedProduct.stok_tersisa}
                </label>
                <input
                  type="number"
                  min="1"
                  value={stockAdjustment.amount}
                  onChange={(e) =>
                    setStockAdjustment({
                      ...stockAdjustment,
                      amount: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setIsStockModalOpen(false)}
                  className="bg-gray-300 text-black px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
