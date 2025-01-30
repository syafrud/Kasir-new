"use client";

import { useState, useEffect } from "react";
import {
  createProduk,
  updateProduk,
  deleteProduk,
} from "@/app/api/produk/actions";
import SearchBar from "@/components/search";
import toast from "react-hot-toast";

interface Produk {
  id: number;
  id_kategori: number;
  kategori: { nama_kategori: string };
  nama_produk: string;
  harga_beli: string;
  harga_jual: string;
  stok: string;
  barcode: string;
}

export default function ProdukPage() {
  const [produks, setProduk] = useState<Produk[]>([]);
  const [kategoriOptions, setProdukOptions] = useState<any[]>([]);
  const [selectedProduk, setSelectedProduk] = useState<number | "">(0);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editProduk, setEditProduk] = useState<Produk | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [produkToDelete, setProdukToDelete] = useState<number | null>(null);

  const fetchProduk = async () => {
    try {
      const res = await fetch(
        `/api/produk?search=${encodeURIComponent(search)}`
      );
      if (!res.ok) {
        const errorText = await res.text();
        setError(errorText || "Failed to fetch produks");
        return;
      }

      const data = await res.json();
      setProduk(data);
    } catch (error) {
      setError(error?.message || "An unexpected error occurred");
    }
  };

  useEffect(() => {
    fetchProduk();
  }, [search]);

  useEffect(() => {
    const fetchProduk = async () => {
      const response = await fetch("/api/kategori");
      const data = await response.json();
      setProdukOptions(data);
    };

    fetchProduk();
  }, []);

  const handleEdit = (produk: Produk) => {
    setIsEditing(true);
    setEditProduk(produk);
    setSelectedProduk(produk.id_kategori); // Update selectedProduk when editing
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
      toast.error(error?.message || "Terjadi kesalahan saat menghapus data");
    } finally {
      setIsConfirmOpen(false);
      setProdukToDelete(null);
      toast.success("Data berhasil dihapus");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    if (isEditing && editProduk) {
      await updateProduk(formData, editProduk.id);
      toast.success("Data berhasil diperbarui");
    } else {
      await createProduk(formData);
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
    setSelectedProduk("");
    setIsModalOpen(true);
  };

  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-4">Produk Management</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <SearchBar
        search={search}
        setSearch={setSearch}
        onAddNew={handleAddNew}
      />

      <table className=" border-collapse border border-gray-200 mt-6">
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
          </tr>
        </thead>
        <tbody>
          {produks.map((produk, index) => (
            <tr key={produk.id}>
              <td className="border p-2 text-center">{index + 1}</td>
              <td className="border p-2 ">{produk.nama_produk}</td>
              <td className="border p-2 ">{produk.kategori?.nama_kategori}</td>
              <td className="border p-2  text-center">{produk.harga_beli}</td>
              <td className="border p-2 ">{produk.harga_jual}</td>
              <td className="border p-2  text-right">{produk.stok}</td>
              <td className="border p-2  text-center">{produk.barcode}</td>
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
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Create/Update*/}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg ">
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
                    defaultValue={isEditing ? editProduk?.nama_produk : ""}
                  />
                </div>
                <div className="w-full min-w-sm items-center gap-2">
                  <label className="block text-base font-medium text-gray-700">
                    Kategori
                  </label>
                  <select
                    name="id_kategori"
                    className="border p-2 rounded w-full mt-2"
                    value={
                      isEditing ? editProduk?.id_kategori : selectedProduk || ""
                    }
                    onChange={(e) => {
                      const value = e.target.value
                        ? Number(e.target.value)
                        : "";
                      setSelectedProduk(value);
                      if (isEditing && editProduk) {
                        setEditProduk({
                          ...editProduk,
                          id_kategori: value,
                        });
                      }
                    }}
                  >
                    <option value="" disabled>
                      Pilih Kategori
                    </option>
                    {kategoriOptions.map((kategori) => (
                      <option key={kategori.id} value={kategori.id}>
                        {kategori.nama_kategori}
                      </option>
                    ))}
                  </select>
                </div>
                {error && (
                  <div className="grid-cols-2">
                    <div className=" "> </div>
                    <div className="text-red-500 grid col-span-1">{error}</div>
                  </div>
                )}
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
                    defaultValue={isEditing ? editProduk?.harga_beli : ""}
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
                    defaultValue={isEditing ? editProduk?.harga_jual : ""}
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
                    defaultValue={isEditing ? editProduk?.stok : ""}
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
                    defaultValue={isEditing ? editProduk?.barcode : ""}
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
                onClick={() => setIsModalOpen(false)}
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
    </div>
  );
}
