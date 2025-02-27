"use client";

import { useState, useEffect, useRef } from "react";
import {
  createProduk,
  updateProduk,
  deleteProduk,
  adjustStock,
} from "@/app/api/produk/actions";
import SearchBar from "@/components/search";
import toast from "react-hot-toast";
import { Plus, Upload, Image as ImageIcon } from "lucide-react";
import RupiahInput from "@/components/RupiahInput";
import Image from "next/image";

interface Produk {
  id: number;
  id_kategori: number;
  kategori: { nama_kategori: string };
  nama_produk: string;
  harga_beli: string;
  harga_jual: string;
  stok: string;
  barcode: string;
  image: string;
}

interface Kategori {
  id: number;
  nama_kategori: string;
}

interface PaginationData {
  produk: Produk[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export default function ProdukPage() {
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stockAdjustment, setStockAdjustment] = useState(0);
  const [adjustmentType, setAdjustmentType] = useState("+");

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
      setProduk(data.produk);
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
    setImagePreview(produk.image || null);
    setSelectedImage(null);
    setStockAdjustment(0);
    setAdjustmentType("+");
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitData = new FormData();
      console.log("Current form data:", formData);
      if (
        !formData.nama_produk ||
        !formData.id_kategori ||
        !formData.harga_beli ||
        !formData.harga_jual ||
        !formData.barcode
      ) {
        toast.error("Semua field harus diisi");
        return;
      }

      if (!isEditing && !selectedImage) {
        toast.error("Gambar produk harus diunggah");
        return;
      }

      submitData.append("nama_produk", formData.nama_produk);
      submitData.append("id_kategori", formData.id_kategori);
      submitData.append("harga_beli", formData.harga_beli);
      submitData.append("harga_jual", formData.harga_jual);
      submitData.append("barcode", formData.barcode);

      if (selectedImage) {
        submitData.append("image", selectedImage);
      }

      if (isEditing && editProduk) {
        if (stockAdjustment !== 0) {
          const currentStock = parseInt(editProduk.stok);
          const adjustment =
            adjustmentType === "+" ? stockAdjustment : -1 * stockAdjustment;
          const newStock = currentStock + adjustment;
          submitData.append("stok", newStock.toString());

          await adjustStock({
            productId: editProduk.id,
            amount: stockAdjustment,
            type: adjustmentType === "+" ? "in" : "out",
          });
        } else {
          submitData.append("stok", editProduk.stok);
        }

        for (let [key, value] of submitData.entries()) {
          console.log(`${key}: ${value}`);
        }

        await updateProduk(submitData, editProduk.id);
        toast.success("Data berhasil diperbarui");
      } else {
        submitData.append("stok", formData.stok);

        for (let [key, value] of submitData.entries()) {
          console.log(`${key}: ${value}`);
        }

        await createProduk(submitData);
        toast.success("Data berhasil ditambahkan");
      }

      fetchProduk();
      setIsModalOpen(false);
      setIsEditing(false);
      setEditProduk(null);
      setSelectedImage(null);
      setImagePreview(null);
      setStockAdjustment(0);
      setAdjustmentType("+");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setEditProduk(null);
    setFormData({
      nama_produk: "",
      id_kategori: "",
      harga_beli: "",
      harga_jual: "",
      stok: "",
      barcode: "",
    });
    setSelectedImage(null);
    setImagePreview(null);
    setStockAdjustment(0);
    setAdjustmentType("+");
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

  const handleAdjustmentTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setAdjustmentType(e.target.value);
  };

  const handleStockAdjustmentInput = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = Math.abs(parseInt(e.target.value) || 0);
    setStockAdjustment(value);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
    setImagePreview(null);
  };

  const calculateFinalStock = () => {
    if (!editProduk) return 0;
    const currentStock = parseInt(editProduk.stok || "0");
    return adjustmentType === "+"
      ? currentStock + stockAdjustment
      : currentStock - stockAdjustment;
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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
          className="flex items-center gap-2 bg-green-500 text-white px-3 my-1 py-1 rounded-lg hover:bg-green-600 transition h-8"
        >
          <Plus size={20} />
        </button>
      </div>

      <table className="border-collapse border border-gray-200 mt-6">
        <thead>
          <tr>
            <th className="border p-2">NO</th>
            <th className="border p-2 w-1/6">Gambar</th>
            <th className="border p-2 w-1/6">Nama Produk</th>
            <th className="border p-2 w-1/6">kategori</th>
            <th className="border p-2 w-1/6">Harga Beli</th>
            <th className="border p-2 w-1/6">Harga Jual</th>
            <th className="border p-2 min-w-16">Stok</th>
            <th className="border p-2 w-1/6">barcode</th>
            <th className="border py-2 px-16 w-52">Actions</th>
          </tr>
        </thead>
        <tbody>
          {produks.map((produk, index) => (
            <tr key={produk.id}>
              <td className="border p-2 text-center">{index + 1}</td>
              <td className="border p-2 text-center">
                {produk.image ? (
                  <Image
                    src={produk.image}
                    alt={produk.nama_produk}
                    width={100}
                    height={100}
                    className="w-full h-24 object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-24">
                    <ImageIcon className="text-gray-300" size={40} />
                  </div>
                )}
              </td>
              <td className="border p-2">{produk.nama_produk}</td>
              <td className="border p-2">{produk.kategori?.nama_kategori}</td>
              <td className="border p-2 text-right">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 2,
                }).format(Number(produk.harga_beli))}
              </td>
              <td className="border p-2 text-right">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 2,
                }).format(Number(produk.harga_jual))}
              </td>
              <td className="border p-2 text-right">{produk.stok}</td>
              <td className="border p-2 text-center">{produk.barcode}</td>
              <td className="border p-2 text-center">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => handleEdit(produk)}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openConfirmModal(produk.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
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
                  <RupiahInput
                    name="harga_beli"
                    placeholder="Harga Beli"
                    className="border p-2 rounded w-full mt-2"
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
                  <RupiahInput
                    name="harga_jual"
                    placeholder="Harga Jual"
                    className="border p-2 rounded w-full mt-2"
                    value={formData.harga_jual}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {isEditing ? (
                  <div className="grid col-span-1 w-full min-w-sm items-center">
                    <label className="block text-base font-medium text-gray-700">
                      Adjustment
                    </label>
                    <div className="flex items-center mt-2">
                      <select
                        value={adjustmentType}
                        onChange={handleAdjustmentTypeChange}
                        className="border-r-0 border p-2 rounded-l"
                      >
                        <option value="+">+</option>
                        <option value="-">-</option>
                      </select>
                      <input
                        type="number"
                        className="border p-2 rounded-r w-full"
                        value={stockAdjustment}
                        onChange={handleStockAdjustmentInput}
                        min="0"
                      />
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Stok Awal: {editProduk?.stok}, Adjustment:{" "}
                      {adjustmentType + stockAdjustment}, Stok Akhir:{" "}
                      {calculateFinalStock()}
                    </div>
                  </div>
                ) : (
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
                )}

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

              {/* Image Upload Section */}
              <div className="col-span-2 mt-3">
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Gambar Produk
                </label>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div
                    className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                    onClick={triggerFileInput}
                  >
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        width={160}
                        height={160}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">
                          Klik untuk upload
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
                    >
                      {imagePreview ? "Ganti Gambar" : "Pilih Gambar"}
                    </button>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                        className="ml-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none"
                      >
                        Hapus
                      </button>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      {selectedImage
                        ? selectedImage.name
                        : isEditing && !selectedImage && imagePreview
                        ? "Gunakan gambar yang ada"
                        : "JPG, PNG, atau GIF (maks. 2MB)"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-span-2 flex justify-end mt-4 gap-2">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="bg-gray-300 text-black px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded"
                >
                  {isEditing ? "Update" : "Add"}
                </button>
              </div>
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
    </div>
  );
}
