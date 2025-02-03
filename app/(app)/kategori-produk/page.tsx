"use client";

import { useState, useEffect } from "react";
import {
  createKategori,
  deleteKategori,
  updateKategori,
} from "@/app/api/kategori/actions";
import SearchBar from "@/components/search";
import toast from "react-hot-toast";

interface Kategori {
  id: number;
  nama_kategori: string;
}

export default function KategoriPage() {
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editKategori, setEditKategori] = useState<Kategori | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama_kategori: "",
  });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [kategoriToDelete, setKategoriToDelete] = useState<number | null>(null);

  const fetchKategori = async () => {
    try {
      const res = await fetch(
        `/api/kategori?search=${encodeURIComponent(search)}`
      );

      if (!res.ok) {
        const errorText = await res.text();
        setError(errorText || "Failed to fetch kategori");
        return;
      }

      const data = await res.json();
      setKategori(data);
    } catch (error) {
      setError(error?.message || "An unexpected error occurred");
    }
  };

  useEffect(() => {
    fetchKategori();
  }, [search]);

  const handleEdit = (kategori: Kategori) => {
    setIsEditing(true);
    setEditKategori(kategori);
    setFormData({ nama_kategori: kategori.nama_kategori });
    setIsModalOpen(true);
  };

  const openConfirmModal = (id: number) => {
    setKategoriToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (kategoriToDelete === null) return;

    try {
      await deleteKategori(kategoriToDelete);
      fetchKategori();
    } catch (error) {
      setError(error?.message || "An error occurred while deleting.");
    } finally {
      setIsConfirmOpen(false);
      setKategoriToDelete(null);
      toast.success("Data berhasil dihapus");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append("nama_kategori", formData.nama_kategori);

    if (isEditing && editKategori) {
      await updateKategori(submitData, editKategori.id);
      toast.success("Data berhasil diperbarui");
    } else {
      await createKategori(submitData);
      toast.success("Data berhasil ditambahkan");
    }
    fetchKategori();
    setIsModalOpen(false);
    setIsEditing(false);
    setEditKategori(null);
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setEditKategori(null);
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      <h1 className="text-2xl font-bold mb-4">Kategori Produk</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <SearchBar
        search={search}
        setSearch={setSearch}
        onAddNew={handleAddNew}
      />

      <table className="border-collapse border border-gray-200 mt-6">
        <thead>
          <tr>
            <th className="border p-2 w-min">NO</th>
            <th className="border p-2 w-full">Nama Kategori</th>
            <th className="border py-2 px-16 w-52">Actions</th>
          </tr>
        </thead>
        <tbody>
          {kategori.map((item, index) => (
            <tr key={item.id}>
              <td className="border p-2">{index + 1}</td>
              <td className="border p-2">{item.nama_kategori}</td>
              <td className="flex flex-row border gap-2 p-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="w-1/2 bg-blue-500 text-white px-4 py-2 rounded mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => openConfirmModal(item.id)}
                  className="w-1/2 bg-red-500 text-white px-4 py-2 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "Edit Kategori" : "Add New Kategori"}
            </h2>
            <form onSubmit={handleFormSubmit}>
              <input
                type="text"
                name="nama_kategori"
                placeholder="Nama Kategori"
                className="border p-2 rounded w-full mt-2"
                value={formData.nama_kategori}
                onChange={handleInputChange}
              />
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
    </div>
  );
}
