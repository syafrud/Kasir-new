"use client";

import { useState, useEffect } from "react";
import {
  createKategori,
  deleteKategori,
  updateKategori,
} from "@/app/api/kategori/actions";
import SearchBar from "@/components/search";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";

interface Kategori {
  id: number;
  nama_kategori: string;
}

interface PaginationData {
  kategori: Kategori[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export default function KategoriPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
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
        `/api/kategori?search=${encodeURIComponent(
          search
        )}&page=${currentPage}&limit=${itemsPerPage}`
      );

      if (!res.ok) {
        const errorText = await res.text();
        setError(errorText || "Failed to fetch kategori");
        return;
      }

      const data: PaginationData = await res.json();
      setKategori(data.kategori);
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
    fetchKategori();
  }, [search, currentPage, itemsPerPage]);

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
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An error occurred while deleting.");
      }
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
