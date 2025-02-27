"use client";

import { useState, useEffect } from "react";
import {
  createPelanggan,
  deletePelanggan,
  updatePelanggan,
} from "@/app/api/pelanggan/actions";
import SearchBar from "@/components/search";
import toast from "react-hot-toast";
import { Pencil, Plus, Trash2 } from "lucide-react";

interface Pelanggan {
  id: number;
  nama: string;
  alamat: string;
  hp: number;
  status: string;
}

interface PaginationData {
  pelanggan: Pelanggan[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export default function PelangganPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [pelanggan, setPelanggan] = useState<Pelanggan[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editPelanggan, setEditPelanggan] = useState<Pelanggan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    alamat: "",
    hp: "",
    status: "",
  });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pelangganToDelete, setPelangganToDelete] = useState<number | null>(
    null
  );

  const fetchPelanggan = async () => {
    try {
      const res = await fetch(
        `/api/pelanggan?search=${encodeURIComponent(
          search
        )}&page=${currentPage}&limit=${itemsPerPage}`
      );

      if (!res.ok) {
        const errorText = await res.text();
        setError(errorText || "Failed to fetch pelanggan");
        return;
      }

      const data: PaginationData = await res.json();
      setPelanggan(data.pelanggan);
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
    fetchPelanggan();
  }, [search, currentPage, itemsPerPage]);

  const handleEdit = (pelanggan: Pelanggan) => {
    setIsEditing(true);
    setEditPelanggan(pelanggan);
    setFormData({
      nama: pelanggan.nama,
      alamat: pelanggan.alamat,
      hp: pelanggan.hp.toString(),
      status: pelanggan.status,
    });
    setIsModalOpen(true);
  };

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
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An error occurred while deleting.");
      }
    } finally {
      setIsConfirmOpen(false);
      setPelangganToDelete(null);
      toast.success("Data berhasil dihapus");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      submitData.append(key, value);
    });
    try {
      if (isEditing && editPelanggan) {
        await updatePelanggan(submitData, editPelanggan.id);
        toast.success("Data berhasil diperbarui");
      } else {
        await createPelanggan(submitData);
        toast.success("Data berhasil ditambahkan");
      }
      fetchPelanggan();
      setIsModalOpen(false);
      setIsEditing(false);
      setEditPelanggan(null);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      toast.error(err.message);
    }
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setEditPelanggan(null);
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
      <h1 className="text-2xl font-bold mb-4">Pelanggan</h1>

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
          className="flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition h-8"
        >
          <Plus size={20} />
        </button>
      </div>

      <table className="w-full border-collapse border border-gray-200 mt-6">
        <thead>
          <tr className="text-center">
            <th className="border p-2 max-w-min">NO</th>
            <th className="border p-2 w-1/6">Nama Pelanggan</th>
            <th className="border p-2 w-3/6">Alamat</th>
            <th className="border p-2 w-1/6">NO HP</th>
            <th className="border p-2 w-1/6">Status</th>
            <th className="border py-2 px-16 w-52">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pelanggan.map((pelanggan, index) => (
            <tr key={pelanggan.id}>
              <td className="border p-2">{index + 1}</td>
              <td className="border p-2">{pelanggan.nama}</td>
              <td className="border p-2">{pelanggan.alamat}</td>
              <td className="border p-2 text-right">{pelanggan.hp}</td>
              <td className="border p-2 text-right">{pelanggan.status}</td>
              <td className="border p-3 text-center">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => handleEdit(pelanggan)}
                    className="bg-blue-500 text-white px-3 py-1 rounded flex items-center gap-1"
                  >
                    <Pencil size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => openConfirmModal(pelanggan.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded flex items-center gap-1"
                  >
                    <Trash2 size={16} />
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
                value={formData.nama}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="alamat"
                placeholder="Alamat"
                className="border p-2 rounded w-full mt-2"
                value={formData.alamat}
                onChange={handleInputChange}
                required
              />
              <input
                type="number"
                name="hp"
                placeholder="NO HP"
                className="border p-2 rounded w-full mt-2"
                value={formData.hp}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="status"
                placeholder="Status"
                className="border p-2 rounded w-full mt-2"
                value={formData.status}
                onChange={handleInputChange}
                required
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
