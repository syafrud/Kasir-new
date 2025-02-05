"use client";

import { useState, useEffect } from "react";
import {
  createPenjualan,
  updatePenjualan,
  deletePenjualan,
} from "@/app/api/penjualan/actions";
import toast from "react-hot-toast";
import SearchBar from "@/components/search/penjualan";

interface Penjualan {
  id: number;
  id_user: number;
  id_pelanggan: number;
  users: { nama_user: string };
  pelanggan: { nama: string };
  diskon: string;
  total_harga: string;
  tanggal_penjualan: Date;
}

interface User {
  id: number;
  nama_user: string;
}

interface Pelanggan {
  id: number;
  nama: string;
}

interface FormData {
  id_user: string;
  id_pelanggan: string;
  diskon: string;
  total_harga: string;
  tanggal_penjualan: string;
}

export default function PenjualanPage() {
  const [penjualan, setPenjualan] = useState<Penjualan[]>([]);
  const [userOptions, setUserOptions] = useState<User[]>([]);
  const [pelangganOptions, setPelangganOptions] = useState<Pelanggan[]>([]);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [totalRange, setTotalRange] = useState({
    minTotal: "",
    maxTotal: "",
  });
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editPenjualan, setEditPenjualan] = useState<Penjualan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [penjualanToDelete, setPenjualanToDelete] = useState<number | null>(
    null
  );

  const [formData, setFormData] = useState<FormData>({
    id_user: "",
    id_pelanggan: "",
    diskon: "",
    total_harga: "",
    tanggal_penjualan: new Date().toISOString(),
  });

  const formatTanggal = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "UTC",
    };

    const dateObj = new Date(date);

    const time = dateObj
      .toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/:/g, ".");

    const dateStr = dateObj.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return `${time}, ${dateStr}`;
  };

  const fetchPenjualan = async () => {
    try {
      const searchParams = new URLSearchParams();
      if (search) searchParams.append("search", search);
      if (dateRange.startDate)
        searchParams.append("startDate", dateRange.startDate);
      if (dateRange.endDate) searchParams.append("endDate", dateRange.endDate);
      if (totalRange.minTotal)
        searchParams.append("minTotal", totalRange.minTotal);
      if (totalRange.maxTotal)
        searchParams.append("maxTotal", totalRange.maxTotal);

      const res = await fetch(`/api/penjualan?${searchParams.toString()}`);
      if (!res.ok) {
        const errorText = await res.text();
        setError(errorText || "Failed to fetch penjualan");
        return;
      }

      const data = await res.json();
      setPenjualan(data);
    } catch (error) {
      setError(error?.message || "An unexpected error occurred");
    }
  };

  useEffect(() => {
    fetchPenjualan();
  }, [
    search,
    dateRange.startDate,
    dateRange.endDate,
    totalRange.minTotal,
    totalRange.maxTotal,
  ]);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await fetch("/api/user");
      const data = await response.json();
      setUserOptions(data);
    };

    const fetchPelanggan = async () => {
      const response = await fetch("/api/pelanggan");
      const data = await response.json();
      setPelangganOptions(data);
    };

    fetchUsers();
    fetchPelanggan();
  }, []);

  const handleEdit = (penjualan: Penjualan) => {
    setIsEditing(true);
    setEditPenjualan(penjualan);

    const date = new Date(penjualan.tanggal_penjualan);
    const formattedDate = date.toISOString();

    setFormData({
      id_user: penjualan.id_user.toString(),
      id_pelanggan: penjualan.id_pelanggan.toString(),
      diskon: penjualan.diskon,
      total_harga: penjualan.total_harga,
      tanggal_penjualan: formattedDate,
    });
    setIsModalOpen(true);
  };

  const openConfirmModal = (id: number) => {
    setPenjualanToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (penjualanToDelete === null) return;

    try {
      await deletePenjualan(penjualanToDelete);
      fetchPenjualan();
      toast.success("Data berhasil dihapus");
    } catch (error) {
      toast.error(error?.message || "Terjadi kesalahan saat menghapus data");
    } finally {
      setIsConfirmOpen(false);
      setPenjualanToDelete(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      submitData.append(key, value);
    });

    try {
      if (isEditing && editPenjualan) {
        await updatePenjualan(submitData, editPenjualan.id);
        toast.success("Data berhasil diperbarui");
      } else {
        await createPenjualan(submitData);
        toast.success("Data berhasil ditambahkan");
      }
      fetchPenjualan();
      setIsModalOpen(false);
      setIsEditing(false);
      setEditPenjualan(null);
    } catch (error) {
      toast.error(error?.message || "Terjadi kesalahan saat menyimpan data");
    }
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setEditPenjualan(null);
    setFormData((prev) => ({
      ...prev,
      tanggal_penjualan: new Date().toISOString(),
    }));
    setIsModalOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-4">Penjualan Management</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <SearchBar
        search={search}
        setSearch={setSearch}
        dateRange={dateRange}
        setDateRange={setDateRange}
        totalRange={totalRange}
        setTotalRange={setTotalRange}
        onAddNew={handleAddNew}
      />

      <table className="border-collapse border border-gray-200 mt-6">
        <thead>
          <tr>
            <th className="border p-2">NO</th>
            <th className="border p-2 w-1/5">Nama Pelangan</th>
            <th className="border p-2 w-1/5">Nama Petugas</th>
            <th className="border p-2 w-1/5">Diskon</th>
            <th className="border p-2 w-1/5">Total</th>
            <th className="border p-2 w-1/5">Tanggal & Waktu</th>
            <th className="border py-2 px-16 w-52">Actions</th>
          </tr>
        </thead>
        <tbody>
          {penjualan.map((item, index) => (
            <tr key={item.id}>
              <td className="border p-2 text-center">{index + 1}</td>
              <td className="border p-2">{item.pelanggan?.nama}</td>
              <td className="border p-2">{item.users?.nama_user}</td>
              <td className="border p-2 text-center">
                Rp {parseInt(item.diskon).toLocaleString("id-ID")}
              </td>
              <td className="border p-2 text-center">
                Rp {parseInt(item.total_harga).toLocaleString("id-ID")}
              </td>
              <td className="border p-2 text-center">
                {formatTanggal(item.tanggal_penjualan)}
              </td>
              <td className="flex flex-row border gap-3 p-3">
                <button
                  onClick={() => handleEdit(item)}
                  className="w-1/2 bg-blue-500 text-white px-4 py-2 rounded"
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

      {/* Modal Create/Update*/}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "Edit Penjualan" : "Add New Penjualan"}
            </h2>
            <form
              onSubmit={handleFormSubmit}
              className="w-full sm:min-w-[400px] grid grid-cols-2 gap-3"
            >
              <div className="grid col-span-1 w-full min-w-sm">
                <div className="w-full min-w-sm items-center gap-2">
                  <label className="block text-base font-medium text-gray-700">
                    Nama Petugas
                  </label>
                  <select
                    name="id_user"
                    className="border p-2 rounded w-full mt-2"
                    value={formData.id_user}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Pilih Petugas</option>
                    {userOptions.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.nama_user}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full min-w-sm items-center gap-2">
                  <label className="block text-base font-medium text-gray-700">
                    Nama Pelanggan
                  </label>
                  <select
                    name="id_pelanggan"
                    className="border p-2 rounded w-full mt-2"
                    value={formData.id_pelanggan}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Pilih Pelanggan</option>
                    {pelangganOptions.map((pelanggan) => (
                      <option key={pelanggan.id} value={pelanggan.id}>
                        {pelanggan.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full min-w-sm items-center">
                  <label className="block text-base font-medium text-gray-700">
                    Diskon
                  </label>
                  <input
                    type="number"
                    name="diskon"
                    placeholder="Masukkan diskon"
                    className="border p-2 rounded w-full mt-2"
                    value={formData.diskon}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid col-span-1 grid-cols-1 w-full min-w-sm">
                <div className="grid col-span-1 w-full min-w-sm items-center">
                  <label className="block text-base font-medium text-gray-700">
                    Total Harga
                  </label>
                  <input
                    type="number"
                    name="total_harga"
                    placeholder="Total harga"
                    className="border p-2 rounded w-full mt-2"
                    min="0"
                    value={formData.total_harga}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid col-span-1 w-full min-w-sm items-center">
                  <label className="block text-base font-medium text-gray-700">
                    Tanggal & Waktu Penjualan
                  </label>
                  <input
                    type="datetime-local"
                    name="tanggal_penjualan"
                    className="border p-2 rounded w-full mt-2"
                    value={formData.tanggal_penjualan.slice(0, 16)} // Show only up to minutes
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        tanggal_penjualan: selectedDate.toISOString(),
                      }));
                    }}
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
    </div>
  );
}
