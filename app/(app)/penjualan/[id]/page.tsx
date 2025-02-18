"use client";

import { useState, useEffect } from "react";
import {
  createDetail,
  updateDetail,
  deleteDetail,
} from "@/app/api/detail/[id]/actions";
import SearchBar from "@/components/search";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";

interface Detail {
  id: number;
  id_penjualan: number;
  id_produk: number;
  produk: { nama_produk: string; harga_jual: string };
  harga_jual: string;
  qty: number;
  total_harga: string;
  tanggal_penjualan: Date;
}

interface ProdukOption {
  id: number;
  nama_produk: string;
  harga_jual: number;
}

export default function DetailPage() {
  const id = useParams()?.id;
  const [details, setDetail] = useState<Detail[]>([]);
  const [produkOptions, setDetailOptions] = useState<ProdukOption[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editDetail, setEditDetail] = useState<Detail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id_penjualan: id,
    id_produk: "",
    harga_jual: "",
    qty: "",
    total_harga: "",
    tanggal_penjualan: ",",
  });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [detailToDelete, setDetailToDelete] = useState<number | null>(null);

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/detail/${id}`);
      if (!res.ok) {
        const errorText = await res.text();
        setError(errorText || "Failed to fetch detail");
        return;
      }

      const data = await res.json();
      setDetail(data);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [search]);

  useEffect(() => {
    const fetchProduk = async () => {
      try {
        const response = await fetch("/api/produk");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDetailOptions(data.produkWithUpdatedStock);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchProduk();
  }, []);

  const formatTanggal = (date: Date) => {
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

  const handleEdit = (detail: Detail) => {
    setIsEditing(true);
    setEditDetail(detail);
    setFormData({
      id_penjualan: detail.id_penjualan.toString(),
      id_produk: detail.id_produk.toString(),
      harga_jual: detail.harga_jual,
      qty: detail.qty.toString(),
      total_harga: detail.total_harga,
      tanggal_penjualan: new Date(detail.tanggal_penjualan).toISOString(),
    });
    setIsModalOpen(true);
  };

  const openConfirmModal = (id: number) => {
    setDetailToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (detailToDelete === null) return;

    try {
      await deleteDetail(detailToDelete);
      fetchDetail();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Terjadi kesalahan saat menghapus data");
      }
    } finally {
      setIsConfirmOpen(false);
      setDetailToDelete(null);
      toast.success("Data berhasil dihapus");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        submitData.append(key, value.toString());
      }
    });

    if (isEditing && editDetail) {
      await updateDetail(submitData, editDetail.id);
      toast.success("Data berhasil diperbarui");
    } else {
      await createDetail(submitData);
      toast.success("Data berhasil ditambahkan");
    }

    fetchDetail();
    setIsModalOpen(false);
    setIsEditing(false);
    setEditDetail(null);
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setEditDetail(null);
    setIsModalOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };

    if (name === "id_produk") {
      const selectedProduk = produkOptions.find((p) => p.id === Number(value));
      if (selectedProduk) {
        updatedFormData.harga_jual = selectedProduk.harga_jual;
      }
    }

    const qty = Number(updatedFormData.qty) || 0;
    const hargaJual = Number(updatedFormData.harga_jual) || 0;

    updatedFormData.total_harga = (qty * hargaJual).toString();

    setFormData(updatedFormData);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-4">Detail Penjualan</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="flex flex-row gap-5 items-center text-center mb-3">
        <SearchBar search={search} setSearch={setSearch} />

        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-green-500 text-white px-3 my-1 py-1 rounded-lg hover:bg-green-600 transition"
        >
          <Plus size={20} />
          Add
        </button>
      </div>

      <table className="border-collapse border border-gray-200 mt-6">
        <thead>
          <tr>
            <th className="border p-2">NO</th>
            <th className="border p-2 w-1/6">Nama Produk</th>
            <th className="border p-2 w-1/6">Harga Jual</th>
            <th className="border p-2 w-1/6">QTY</th>
            <th className="border p-2 w-1/6">Total Harga</th>
            <th className="border py-2 px-16 w-52">Tgl Penjualan</th>
          </tr>
        </thead>
        <tbody>
          {details.map((detail, index) => (
            <tr key={detail.id}>
              <td className="border p-2 text-center">{index + 1}</td>
              <td className="border p-2">{detail.produk?.nama_produk}</td>
              <td className="border p-2">{detail.harga_jual}</td>
              <td className="border p-2 text-center">{detail.qty}</td>
              <td className="border p-2">{detail.total_harga}</td>
              <td className="border p-2 text-right">
                {formatTanggal(detail.tanggal_penjualan)}
              </td>
              <td className="flex flex-row border gap-3 p-3">
                <button
                  onClick={() => handleEdit(detail)}
                  className="w-1/2 bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => openConfirmModal(detail.id)}
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
              {isEditing ? "Edit Detail" : "Add New Detail"}
            </h2>
            <form
              onSubmit={handleFormSubmit}
              className="w-full sm:min-w-[400px] grid grid-cols-2 gap-3"
            >
              <div className="grid col-span-1 w-full min-w-sm">
                <div className="w-full min-w-sm items-center gap-2">
                  <input
                    type="number"
                    name="id_penjualan"
                    value={id}
                    required
                    readOnly
                    // hidden
                  />

                  <label className="block text-base font-medium text-gray-700">
                    Produk
                  </label>
                  <select
                    name="id_produk"
                    className="border p-2 rounded w-full mt-2"
                    value={formData.id_produk}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>
                      Pilih Produk
                    </option>
                    {Array.isArray(produkOptions) &&
                      produkOptions.map((produk) => (
                        <option key={produk.id} value={produk.id}>
                          {produk.nama_produk}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="grid col-span-1 w-full min-w-sm items-center">
                  <label className="block text-base font-medium text-gray-700">
                    QTY
                  </label>
                  <input
                    type="number"
                    name="qty"
                    placeholder="QTY"
                    className="border p-2 rounded w-full mt-2"
                    value={formData.qty}
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
                    readOnly
                  />
                </div>

                <div className="grid col-span-1 w-full min-w-sm items-center">
                  <label className="block text-base font-medium text-gray-700">
                    Total Harga
                  </label>
                  <input
                    type="number"
                    name="total_harga"
                    placeholder="Total Harga"
                    className="border p-2 rounded w-full mt-2"
                    value={formData.total_harga}
                    onChange={handleInputChange}
                    required
                    readOnly
                  />
                </div>
              </div>
              <div className="grid col-span-2 w-full min-w-sm items-center">
                <label className="block text-base font-medium text-gray-700">
                  Tanggal & Waktu Penjualan
                </label>
                <input
                  type="datetime-local"
                  name="tanggal_penjualan"
                  className="border p-2 rounded w-full mt-2"
                  value={formData.tanggal_penjualan.slice(0, 16)}
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
