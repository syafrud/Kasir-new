"use client";

import { useState, useEffect } from "react";
import {
  createKategori,
  updateKategori,
  deleteKategori,
} from "@/app/api/kategori/actions";
import SearchBar from "@/components/search";

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
    setIsModalOpen(true); // Open the modal when editing
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteKategori(new FormData(), id); // Assuming the ID is enough for deletion
      fetchKategori();
    } catch (error) {
      setError(error?.message || "An error occurred while deleting.");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    if (isEditing && editKategori) {
      await updateKategori(formData, editKategori.id);
    } else {
      await createKategori(formData);
    }
    fetchKategori();
    setIsModalOpen(false); // Close the modal after submission
    setIsEditing(false);
    setEditKategori(null);
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setEditKategori(null);
    setIsModalOpen(true);
  };

  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-4">Kategori</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <SearchBar
        search={search}
        setSearch={setSearch}
        onAddNew={handleAddNew}
      />

      <table className=" w-full border-collapse border border-gray-200 mt-6">
        <thead>
          <tr>
            <th className="border p-2 w-min">ID</th>
            <th className="border p-2 w-full">Nama Kategori</th>
            <th className="border p-2 w-min">Actions</th>
          </tr>
        </thead>
        <tbody>
          {kategori.map((item) => (
            <tr key={item.id}>
              <td className="border p-2">{item.id}</td>
              <td className="border p-2">{item.nama_kategori}</td>
              <td className="flex flex-row border gap-2 p-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="w-full bg-red-500 text-white px-4 py-2 rounded"
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
                defaultValue={isEditing ? editKategori?.nama_kategori : ""}
              />
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
    </div>
  );
}
