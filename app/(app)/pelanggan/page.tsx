"use client";

import { useState, useEffect } from "react";
import {
  createPelanggan,
  deletePelanggan,
  updatePelanggan,
} from "@/app/api/pelanggan/actions";
import SearchBar from "@/components/search";

interface Pelanggan {
  id: number;
  nama: string;
  alamat: string;
  hp: string;
  status: string;
  // : string;
}

export default function PelangganPage() {
  const [pelanggan, setPelanggan] = useState<Pelanggan[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editPelanggan, setEditPelanggan] = useState<Pelanggan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pelangganToDelete, setPelangganToDelete] = useState<number | null>(
    null
  );

  const fetchPelanggan = async () => {
    try {
      const res = await fetch(
        `/api/pelanggan?search=${encodeURIComponent(search)}`
      );

      if (!res.ok) {
        const errorText = await res.text();
        setError(errorText || "Failed to fetch pelanggan");
        return;
      }

      const data = await res.json();
      setPelanggan(data);
    } catch (error) {
      setError(error?.message || "An unexpected error occurred");
    }
  };

  useEffect(() => {
    fetchPelanggan();
  }, [search]);

  const handleEdit = (pelanggan: Pelanggan) => {
    setIsEditing(true);
    setEditPelanggan(pelanggan);
    setIsModalOpen(true);
  };
  const openConfirmModal = (id: number) => {
    setPelangganToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (pelangganToDelete === null) return;

    try {
      await deletePelanggan(pelangganToDelete);
      fetchPelanggan();
    } catch (error) {
      setError(error?.message || "An error occurred while deleting.");
    } finally {
      setIsConfirmOpen(false);
      setPelangganToDelete(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    if (isEditing && editPelanggan) {
      await updatePelanggan(formData, editPelanggan.id);
    } else {
      await createPelanggan(formData);
    }
    fetchPelanggan();
    setIsModalOpen(false);
    setIsEditing(false);
    setEditPelanggan(null);
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setEditPelanggan(null);
    setIsModalOpen(true);
  };

  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-4">Pelanggan</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <SearchBar
        search={search}
        setSearch={setSearch}
        onAddNew={handleAddNew}
      />

      <table className="w-full border-collapse border border-gray-200 mt-6">
        <thead>
          <tr className=" text-center">
            <th className="border p-2 max-w-min">NO</th>
            <th className="border p-2 w-1/6">Nama Pelanggan</th>
            <th className="border p-2 w-3/6">Alamat</th>
            <th className="border p-2 w-1/6">NO HP</th>
            <th className="border p-2 w-1/6">Status</th>
            <th className="border py-2 px-16 w-52">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pelanggan.map((item, index) => (
            <tr key={item.id}>
              <td className="border p-2">{index + 1}</td>
              <td className="border p-2">{item.nama}</td>
              <td className="border p-2">{item.alamat}</td>
              <td className="border p-2 text-right">{item.hp}</td>
              <td className="border p-2 text-right">{item.status}</td>
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
              {isEditing ? "Edit Pelanggan" : "Add New Pelanggan"}
            </h2>
            <form onSubmit={handleFormSubmit}>
              <input
                type="text"
                name="nama"
                placeholder="Nama Pelanggan"
                className="border p-2 rounded w-full mt-2"
                defaultValue={isEditing ? editPelanggan?.nama : ""}
              />
              <input
                type="text"
                name="alamat"
                placeholder="alamat"
                className="border p-2 rounded w-full mt-2"
                defaultValue={isEditing ? editPelanggan?.alamat : ""}
              />
              <input
                type="text"
                name="hp"
                placeholder="NO HP"
                className="border p-2 rounded w-full mt-2"
                defaultValue={isEditing ? editPelanggan?.hp : ""}
              />
              <input
                type="text"
                name="status"
                placeholder="Status"
                className="border p-2 rounded w-full mt-2"
                defaultValue={isEditing ? editPelanggan?.status : ""}
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
