// File: app/penjualan/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  createPenjualan,
  updatePenjualan,
  deletePenjualan,
} from "@/app/api/penjualan/actions";
import toast from "react-hot-toast";
import SearchBar from "@/components/search/penjualan";
import { useRouter } from "next/navigation";
import SearchBarProduk from "@/components/search/produkSearch";
import Image from "next/image";
import { PrintInvoice } from "@/components/print/PrintInvoice";
import { NotaPrint } from "@/components/print/NotaPrint";
import { CircleEllipsis, Printer, SquarePen, X } from "lucide-react";
import PelangganSearch from "@/components/search/pelangganSearch";
import UserSearch from "@/components/search/userSearch";

interface Penjualan {
  id: number;
  id_user: number;
  id_pelanggan: number;
  users: { nama_user: string };
  pelanggan: { nama: string };
  diskon: string;
  total_harga: string;
  penyesuaian: string;
  total_bayar: string;
  kembalian: string;
  tanggal_penjualan: Date;
}

interface User {
  id: number;
  username: string;
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
  penyesuaian: string;
  total_bayar: string;
  kembalian: string;
  tanggal_penjualan: string;
}

interface PaginationData {
  penjualan: Penjualan[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

interface Produk {
  id: number;
  nama_produk: string;
  harga_jual: number;
  stok: number;
  image: string;
}

interface PenjualanProduct {
  id_produk: number;
  qty: number;
  diskon: number;
  produk: {
    nama_produk: string;
    harga_jual: string;
  };
}

export default function PenjualanPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const router = useRouter();
  const [penjualan, setPenjualan] = useState<Penjualan[]>([]);
  const [userOptions, setUserOptions] = useState<User[]>([]);
  const [pelangganOptions, setPelangganOptions] = useState<Pelanggan[]>([]);
  const [isPelanggan, setIsPelanggan] = useState(false);
  const [produkOptions, setProdukOptions] = useState<Produk[]>([]);
  const [selectedProduk, setSelectedProduk] = useState<
    { id: number; quantity: number; diskon: number }[]
  >([]);
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
    penyesuaian: "0",
    total_bayar: "",
    kembalian: "0",
    tanggal_penjualan: new Date().toISOString(),
  });

  const handleDetail = (id: number) => {
    router.push(`/penjualan/${id}`);
  };

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

  const fetchPenjualan = useCallback(async () => {
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

      const res = await fetch(
        `/api/penjualan?${searchParams.toString()}&page=${currentPage}&limit=${itemsPerPage}`
      );
      if (!res.ok) {
        const errorText = await res.text();
        setError(errorText || "Failed to fetch penjualan");
        return;
      }

      const data: PaginationData = await res.json();
      setPenjualan(data.penjualan);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  }, [
    search,
    dateRange.startDate,
    dateRange.endDate,
    totalRange.minTotal,
    totalRange.maxTotal,
    currentPage,
    itemsPerPage,
  ]);

  useEffect(() => {
    fetchPenjualan();
  }, [
    search,
    dateRange.startDate,
    dateRange.endDate,
    totalRange.minTotal,
    totalRange.maxTotal,
    currentPage,
    itemsPerPage,
    fetchPenjualan,
  ]);

  useEffect(() => {
    const fetchProduk = async () => {
      try {
        const response = await fetch("/api/penjualan/produk");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProdukOptions(data.produk);
        console.log(data);
      } catch (error) {
        console.error("Error fetching produk:", error);
      }
    };

    fetchProduk();
  }, []);

  useEffect(() => {
    const total = selectedProduk.reduce((acc, item) => {
      const produk = produkOptions.find((b) => b.id === item.id);
      return acc + (produk ? produk.harga_jual * item.quantity : 0);
    }, 0);
    setFormData((prev) => ({ ...prev, total_harga: total.toString() }));
  }, [selectedProduk, produkOptions]);

  useEffect(() => {
    if (!isPelanggan) {
      setFormData((prev) => ({ ...prev, id_pelanggan: "" }));
    }
  }, [isPelanggan]);

  const handleProductChange = (
    id: number,
    quantity: number,
    diskon: number = 0
  ) => {
    setSelectedProduk((prev) => {
      const existingProduct = prev.find((item) => item.id === id);
      if (existingProduct) {
        return prev.map((item) =>
          item.id === id ? { ...item, quantity, diskon } : item
        );
      } else {
        return [...prev, { id, quantity, diskon }];
      }
    });
  };

  useEffect(() => {
    const totalHargaSebelumDiskon = selectedProduk.reduce((total, item) => {
      const produk = produkOptions.find((p) => p.id === item.id);
      const hargaProduk = produk ? produk.harga_jual * item.quantity : 0;
      return total + hargaProduk;
    }, 0);

    const totalDiskonProduk = selectedProduk.reduce((acc, item) => {
      return acc + (item.diskon || 0) * item.quantity;
    }, 0);

    const diskonPelanggan = isPelanggan
      ? Math.round(totalHargaSebelumDiskon * 0.1)
      : 0;

    const totalSetelahDiskon =
      totalHargaSebelumDiskon - totalDiskonProduk - diskonPelanggan;

    const penyesuaian = parseCurrency(formData.penyesuaian);

    const totalAkhir = totalSetelahDiskon + penyesuaian;

    setFormData((prev) => ({
      ...prev,
      total_harga: Math.round(totalAkhir).toString(),
      diskon: diskonPelanggan.toString(),
    }));
  }, [selectedProduk, isPelanggan, produkOptions, formData.penyesuaian]);

  const parseCurrency = (value: string) => {
    if (!value) return 0;
    return parseInt(value.replace(/\D/g, ""), 10) || 0;
  };

  useEffect(() => {
    if (
      formData.total_harga ||
      formData.diskon ||
      formData.penyesuaian ||
      formData.total_bayar
    ) {
      const totalHarga = parseCurrency(formData.total_harga);
      const totalBayar = parseCurrency(formData.total_bayar);

      const kembalian = totalBayar >= totalHarga ? totalBayar - totalHarga : 0;

      setFormData((prev) => ({
        ...prev,
        kembalian: kembalian.toString(),
      }));
    }
  }, [
    formData.total_harga,
    formData.diskon,
    formData.penyesuaian,
    formData.total_bayar,
  ]);

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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/penjualan/users");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Users Data:", data);
        setUserOptions(data.users);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    const fetchPelanggan = async () => {
      try {
        const response = await fetch("/api/penjualan/pelanggan");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPelangganOptions(data.pelanggan);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
    fetchPelanggan();
  }, []);

  const fetchPenjualanProducts = async (penjualanId: number) => {
    try {
      const response = await fetch(`/api/detail/${penjualanId}`);
      const data = await response.json();
      return data as PenjualanProduct[];
    } catch (error) {
      console.error("Error fetching penjualan products:", error);
      return [] as PenjualanProduct[];
    }
  };

  const handleEdit = async (penjualan: Penjualan) => {
    setIsEditing(true);
    setEditPenjualan(penjualan);

    const date = new Date(penjualan.tanggal_penjualan);
    const formattedDate = date.toISOString();

    setFormData({
      id_user: penjualan.id_user ? penjualan.id_user.toString() : "",
      id_pelanggan: penjualan.id_pelanggan
        ? penjualan.id_pelanggan.toString()
        : "",
      diskon: penjualan.diskon || "",
      total_harga: penjualan.total_harga || "",
      penyesuaian: penjualan.penyesuaian || "0",
      total_bayar: penjualan.total_bayar || "",
      kembalian: penjualan.kembalian || "0",
      tanggal_penjualan: formattedDate,
    });

    setIsPelanggan(!!penjualan.id_pelanggan);

    try {
      const products = await fetchPenjualanProducts(penjualan.id);

      const tempProducts = products.map((product: PenjualanProduct) => ({
        id: product.id_produk,
        nama_produk: product.produk.nama_produk,
        harga_jual: parseFloat(product.produk.harga_jual),
        stok: 0,
        image: "",
      }));

      const existingIds = produkOptions.map((p) => p.id);
      const newProducts = tempProducts.filter(
        (p) => !existingIds.includes(p.id)
      );

      setProdukOptions((prev) => [...prev, ...newProducts]);

      setSelectedProduk(
        products.map((product: PenjualanProduct) => ({
          id: product.id_produk,
          quantity: product.qty,
          diskon: product.diskon,
        }))
      );
    } catch (error) {
      console.error("Error setting up edit mode:", error);
    }

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
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Terjadi kesalahan saat menghapus data");
      }
    } finally {
      setIsConfirmOpen(false);
      setPenjualanToDelete(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isPelanggan && !formData.id_pelanggan) {
      toast.error("Silakan pilih pelanggan sebelum melanjutkan.");
      return;
    }

    if (!formData.id_user) {
      toast.error("Silakan pilih petugas sebelum melanjutkan.");
      return;
    }

    if (selectedProduk.length === 0) {
      setError(
        "Silakan pilih setidaknya satu produk sebelum melakukan penjualan."
      );
      toast.error("Silakan pilih setidaknya satu produk.");
      return;
    }

    const totalBayar = parseInt(formData.total_bayar || "0", 10);
    const totalHarga = parseInt(formData.total_harga || "0", 10);

    if (totalBayar === 0) {
      toast.error(
        "Total bayar tidak boleh 0. Silakan masukkan jumlah pembayaran."
      );
      return;
    }

    if (totalBayar < totalHarga) {
      toast.error(
        "Total bayar kurang dari total harga. Silakan masukkan pembayaran yang cukup."
      );
      return;
    }

    try {
      const submitData = new FormData();

      submitData.append("id_user", formData.id_user.toString());
      submitData.append(
        "id_pelanggan",
        isPelanggan ? formData.id_pelanggan.toString() : ""
      );
      submitData.append("diskon", String(parseInt(formData.diskon || "0", 10)));
      submitData.append(
        "total_harga",
        String(parseInt(formData.total_harga || "0", 10))
      );
      submitData.append(
        "penyesuaian",
        String(parseInt(formData.penyesuaian || "0", 10))
      );
      submitData.append(
        "total_bayar",
        String(parseInt(formData.total_bayar || "0", 10))
      );
      submitData.append(
        "kembalian",
        String(parseInt(formData.kembalian || "0", 10))
      );

      submitData.append("tanggal_penjualan", formData.tanggal_penjualan);
      submitData.append("selectedProduk", JSON.stringify(selectedProduk));

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
      setSelectedProduk([]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan data."
      );
    }
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setEditPenjualan(null);
    setFormData({
      id_user: "",
      id_pelanggan: "",
      diskon: "",
      total_harga: "",
      penyesuaian: "0",
      total_bayar: "",
      kembalian: "0",
      tanggal_penjualan: new Date().toISOString(),
    });
    setSelectedProduk([]);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (
      ["diskon", "total_harga", "penyesuaian", "total_bayar"].includes(name)
    ) {
      setFormData((prev) => ({
        ...prev,
        [name]: value.replace(/\D/g, ""),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const formatCurrency = (value: string) => {
    if (!value) return "";
    const numericValue = value.replace(/\D/g, "");
    return new Intl.NumberFormat("id-ID").format(Number(numericValue));
  };

  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-4">Penjualan Management</h1>

      <div className="flex flex-row gap-5 items-end text-center mb-3 ">
        <div className="flex items-center gap-4 min-h-10">
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

        <SearchBar
          search={search}
          setSearch={setSearch}
          dateRange={dateRange}
          setDateRange={setDateRange}
          totalRange={totalRange}
          setTotalRange={setTotalRange}
          onAddNew={handleAddNew}
        />
      </div>

      <table className="border-collapse border border-gray-200 mt-6">
        <thead>
          <tr>
            <th className="border p-2">NO</th>
            <th className="border p-2 w-1/5">Nama Pelangan</th>
            <th className="border p-2 w-1/5">Nama Petugas</th>
            <th className="border p-2 w-1/5">Diskon</th>
            <th className="border p-2 w-1/5">Total</th>
            <th className="border p-2 w-1/5">Tanggal & Waktu</th>
            <th className="border py-2 "> Invoice</th>
            <th className="border py-2 ">Actions</th>
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
              <td>
                <div className="flex flex-row border gap-2 p-3">
                  <div className="relative w-1/2 group">
                    <button
                      onClick={() => NotaPrint(item.id)}
                      className="flex justify-center items-center max-w-9 max-h-9 bg-[#6c757d] text-white px-2 py-2 rounded text-sm hover:bg-[#565e64] transition-colors"
                    >
                      <Printer className="" />
                    </button>
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block">
                      <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                        Print Nota
                      </div>
                      <div className="w-2 h-2 bg-gray-800 transform rotate-45 mx-auto -mt-1"></div>
                    </div>
                  </div>
                  <div className="relative w-1/2 group">
                    <button
                      onClick={() => PrintInvoice(item.id)}
                      className="flex justify-center items-center max-w-9 max-h-9 bg-[#ffc107] text-black px-2 py-2 rounded text-sm hover:bg-[#ffca2c] transition-colors"
                    >
                      <Printer className="" />
                    </button>
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block">
                      <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                        Print Invoice
                      </div>
                      <div className="w-2 h-2 bg-gray-800 transform rotate-45 mx-auto -mt-1"></div>
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <div className="flex flex-row border gap-2 p-3">
                  <div className="relative w-1/3 group">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex justify-center items-center max-w-9 max-h-9 bg-[#198754] text-white px-2 py-2 rounded text-sm hover:bg-[#146c43] transition-colors"
                    >
                      <SquarePen className="" />
                    </button>
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block">
                      <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                        Edit Data
                      </div>
                      <div className="w-2 h-2 bg-gray-800 transform rotate-45 mx-auto -mt-1"></div>
                    </div>
                  </div>

                  <div className="relative w-1/3 group">
                    <button
                      onClick={() => openConfirmModal(item.id)}
                      className="flex justify-center items-center max-w-9 max-h-9 bg-[#dc3545] text-white px-2 py-2 rounded text-sm hover:bg-[#b02a37] transition-colors"
                    >
                      <X className="" />
                    </button>
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block">
                      <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                        Delete Data
                      </div>
                      <div className="w-2 h-2 bg-gray-800 transform rotate-45 mx-auto -mt-1"></div>
                    </div>
                  </div>

                  <div className="relative w-1/3 group">
                    <button
                      onClick={() => handleDetail(item.id)}
                      className="flex justify-center items-center max-w-9 max-h-9 bg-[#0d6efd] text-white px-2 py-2 rounded text-sm hover:bg-[#0b5ed7] transition-colors"
                    >
                      <CircleEllipsis className="" />
                    </button>
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block">
                      <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                        Detail
                      </div>
                      <div className="w-2 h-2 bg-gray-800 transform rotate-45 mx-auto -mt-1"></div>
                    </div>
                  </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg animate-fadeIn max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white rounded-t-xl">
              <h2 className="text-xl font-semibold">
                {isEditing ? "Edit Penjualan" : "Tambah Penjualan"}
              </h2>
              <button
                onClick={handleModalClose}
                className="text-gray-500 hover:text-red-500 transition"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="overflow-y-auto p-4 flex-1">
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <UserSearch
                      onSelect={(user) => {
                        setFormData((prev) => ({
                          ...prev,
                          id_user: user.id.toString(),
                        }));
                      }}
                      selectedId={formData.id_user}
                    />
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Apakah pelanggan?
                    </label>
                    <select
                      name="isPelanggan"
                      value={isPelanggan ? "yes" : "no"}
                      onChange={(e) => setIsPelanggan(e.target.value === "yes")}
                      className="border rounded-lg p-2 w-full mt-1"
                    >
                      <option value="no">Tidak</option>
                      <option value="yes">Ya</option>
                    </select>
                  </div>
                </div>

                {isPelanggan && (
                  <div>
                    <PelangganSearch
                      onSelect={(pelanggan) => {
                        setFormData((prev) => ({
                          ...prev,
                          id_pelanggan: pelanggan.id.toString(),
                        }));
                      }}
                      selectedId={formData.id_pelanggan}
                    />
                  </div>
                )}

                {/* Produk Selection */}
                <SearchBarProduk
                  onSelect={(produk) => {
                    setSelectedProduk((prev) => {
                      const existingProduct = prev.find(
                        (item) => item.id === produk.id
                      );

                      if (existingProduct) {
                        return prev.map((item) =>
                          item.id === produk.id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                        );
                      } else {
                        return [
                          ...prev,
                          { id: produk.id, quantity: 1, diskon: 0 },
                        ];
                      }
                    });
                  }}
                />

                {/* Selected Products List */}
                <div className="mt-2">
                  {selectedProduk.map((item, index) => {
                    const produk = produkOptions.find((p) => p.id === item.id);
                    return (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 border rounded-lg mt-1"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 flex-shrink-0">
                            {produk?.image ? (
                              <Image
                                src={produk.image}
                                alt={produk?.nama_produk || ""}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover rounded-md"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                                <span className="text-gray-400 text-xs">
                                  No
                                </span>
                              </div>
                            )}
                          </div>
                          <span>
                            {produk?.nama_produk} - Rp{" "}
                            {produk?.harga_jual.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-700">
                              Diskon
                            </p>
                            <input
                              type="number"
                              value={item.diskon || 0}
                              onChange={(e) =>
                                handleProductChange(
                                  item.id,
                                  item.quantity,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              placeholder="Diskon"
                              className="w-20 border border-gray-300 rounded-md p-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-700">
                              Jumlah
                            </p>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const newQuantity =
                                  parseInt(e.target.value) || 0;
                                const updatedProduk = selectedProduk.map(
                                  (prod) =>
                                    prod.id === item.id
                                      ? { ...prod, quantity: newQuantity }
                                      : prod
                                );
                                setSelectedProduk(updatedProduk);
                              }}
                              className="w-20 border border-gray-300 rounded-md p-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <button
                            type="button"
                            className=" text-red-500 hover:text-red-700 transition-colors duration-200"
                            onClick={() =>
                              setSelectedProduk(
                                selectedProduk.filter((p) => p.id !== item.id)
                              )
                            }
                          >
                            <X />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-4 z-10">
                  <div>
                    <label className="block text-gray-700 font-medium text-sm">
                      Diskon
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700">
                        Rp
                      </span>
                      <input
                        type="text"
                        name="diskon"
                        className="border rounded-lg p-2 w-full pl-10 mt-1"
                        placeholder="Masukkan diskon"
                        value={formatCurrency(formData.diskon)}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium text-sm">
                      Total Harga
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700">
                        Rp
                      </span>
                      <input
                        type="text"
                        name="total_harga"
                        className="border rounded-lg p-2 w-full pl-10 mt-1"
                        placeholder="Total harga"
                        value={formatCurrency(formData.total_harga)}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* New fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 z-10">
                  <div>
                    <label className="block text-gray-700 font-medium text-sm">
                      Penyesuaian
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700">
                        Rp
                      </span>
                      <input
                        type="text"
                        name="penyesuaian"
                        className="border rounded-lg p-2 w-full pl-10 mt-1"
                        placeholder="Masukkan penyesuaian"
                        value={formatCurrency(formData.penyesuaian || "0")}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium text-sm">
                      Total Bayar
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700">
                        Rp
                      </span>
                      <input
                        type="text"
                        name="total_bayar"
                        className="border rounded-lg p-2 w-full pl-10 mt-1"
                        placeholder="Masukkan total bayar"
                        value={formatCurrency(formData.total_bayar || "0")}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium text-sm">
                      Kembalian
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700">
                        Rp
                      </span>
                      <input
                        type="text"
                        name="kembalian"
                        className="border rounded-lg p-2 w-full pl-10 mt-1"
                        placeholder="Kembalian"
                        value={formatCurrency(formData.kembalian || "0")}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium text-sm">
                    Tanggal & Waktu Penjualan
                  </label>
                  <input
                    type="datetime-local"
                    name="tanggal_penjualan"
                    className="border rounded-lg p-2 w-full mt-1"
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
                <div className="border-t p-4 sticky bottom-0 bg-white rounded-b-xl">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleModalClose}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition text-sm"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition text-sm"
                    >
                      {isEditing ? "Update" : "Tambah"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
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
