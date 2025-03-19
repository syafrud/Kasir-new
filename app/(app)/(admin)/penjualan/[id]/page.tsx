"use client";

import { useState, useEffect, useCallback } from "react";
import SearchBar from "@/components/search";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { AlertCircle, ArrowLeft, Printer } from "lucide-react";

interface Detail {
  id: number;
  id_penjualan: number;
  id_produk: number;
  produk: { nama_produk: string; harga_jual: string };
  harga_jual: string;
  harga_beli: string;
  diskon: number;
  qty: number;
  total_harga: string;
  tanggal_penjualan: Date;
}

interface PenjualanHeader {
  id: number;
  total_harga: string;
  diskon: number;
  penyesuaian: string;
  total_bayar: string;
  kembalian: string;
  tanggal_penjualan: Date;
  pelanggan: { nama: string; hp: string } | null;
  users: { nama_user: string };
}

export default function DetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [details, setDetail] = useState<Detail[]>([]);
  const [headerInfo, setHeaderInfo] = useState<PenjualanHeader | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalItems: 0,
    totalQuantity: 0,
    subTotalDiskon: 0,
    subTotal: 0,
  });

  const fetchPenjualanHeader = useCallback(async () => {
    try {
      if (!id) return;

      const res = await fetch(`/api/penjualan/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch penjualan header");
      }

      const data = await res.json();
      setHeaderInfo(data);
    } catch (error) {
      console.error("Error fetching header:", error);
    }
  }, [id]);

  const fetchDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!id) {
        setError("No ID provided");
        setIsLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (search) {
        params.append("search", search);
      }

      const res = await fetch(`/api/detail/${id}?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch details");
      }

      const text = await res.text();
      const data = text ? JSON.parse(text) : [];

      // Pastikan data adalah array sebelum melakukan reduce
      const detailsArray = Array.isArray(data) ? data : [];
      setDetail(detailsArray);

      // Calculate summary dengan memastikan detailsArray adalah array
      const totalItems = detailsArray.length;
      const totalQuantity = detailsArray.reduce(
        (sum, item) => sum + (item.qty || 0),
        0
      );

      const subTotalDiskon = detailsArray.reduce(
        (sum, item) => sum + (parseFloat(item.diskon * item.qty) || 0),
        0
      );

      const subTotal = detailsArray.reduce(
        (sum, item) => sum + (parseFloat(item.total_harga) || 0),
        0
      );

      setSummary({
        totalItems,
        totalQuantity,
        subTotalDiskon,
        subTotal,
      });

      setError("");
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to fetch details");
      setDetail([]);
      setSummary({
        totalItems: 0,
        totalQuantity: 0,
        subTotalDiskon: 0,
        subTotal: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, search]);

  useEffect(() => {
    fetchPenjualanHeader();
    fetchDetail();
  }, [fetchPenjualanHeader, fetchDetail]);

  const formatTanggal = (date: Date) => {
    try {
      const dateObj = new Date(date);
      return format(dateObj, "HH.mm.ss, EEE, d MMM yyyy", { locale: id });
    } catch (e) {
      return "Invalid date";
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);
  };

  const handleBackToList = () => {
    router.push("/penjualan");
  };

  return (
    <div className="">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Detail Penjualan #{id}
        </h1>
        <button
          onClick={handleBackToList}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 transition-colors flex items-center"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Kembali
        </button>
      </div>

      {headerInfo && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-700">
              Informasi Transaksi
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-gray-600">Tanggal:</p>
              <p className="font-medium">
                {formatTanggal(headerInfo.tanggal_penjualan)}
              </p>

              <p className="text-gray-600">Kasir:</p>
              <p className="font-medium">{headerInfo.users.nama_user}</p>

              <p className="text-gray-600">Pelanggan:</p>
              <p className="font-medium">
                {headerInfo.pelanggan?.nama || "Umum"}
              </p>

              {headerInfo.pelanggan?.hp && (
                <>
                  <p className="text-gray-600">Telepon:</p>
                  <p className="font-medium">{headerInfo.pelanggan.hp}</p>
                </>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-700">
              Ringkasan Pembayaran
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-gray-600">Total Belanja:</p>
              <p className="font-medium">
                {formatCurrency(headerInfo.total_harga)}
              </p>

              <p className="text-gray-600">Diskon:</p>
              <p className="font-medium">{formatCurrency(headerInfo.diskon)}</p>

              <p className="text-gray-600">Penyesuaian:</p>
              <p className="font-medium">
                {formatCurrency(headerInfo.penyesuaian)}
              </p>

              <p className="text-gray-600 font-semibold">Total Bayar:</p>
              <p className="font-bold text-blue-600">
                {formatCurrency(headerInfo.total_bayar)}
              </p>

              <p className="text-gray-600">Kembalian:</p>
              <p className="font-medium">
                {formatCurrency(headerInfo.kembalian)}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4 border border-red-200">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-red-700" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
        <div className="w-full md:w-1/3">
          <SearchBar search={search} setSearch={setSearch} />
        </div>

        <div className="flex gap-4 text-sm">
          <div className="bg-blue-50 p-2 rounded-md border border-blue-100">
            <span className="text-blue-500 font-semibold">
              {summary.totalItems}
            </span>{" "}
            Produk
          </div>
          <div className="bg-green-50 p-2 rounded-md border border-green-100">
            <span className="text-green-500 font-semibold">
              {summary.totalQuantity}
            </span>{" "}
            Total Qty
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Produk
                  </th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Harga Jual
                  </th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diskon
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QTY
                  </th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Diskon
                  </th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {details.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-4 px-4 text-center text-gray-500"
                    >
                      Tidak ada data produk yang ditemukan
                    </td>
                  </tr>
                ) : (
                  details.map((detail, index) => (
                    <tr
                      key={detail.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                        {detail.produk?.nama_produk}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">
                        {formatCurrency(detail.harga_jual)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">
                        {parseFloat(detail.diskon) > 0
                          ? formatCurrency(detail.diskon)
                          : "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-center">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                          {detail.qty}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">
                        {parseFloat(detail.diskon) > 0
                          ? formatCurrency(detail.diskon * detail.qty)
                          : "-"}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(detail.total_harga)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td
                    colSpan={4}
                    className="py-3 px-4 text-right text-sm font-medium text-gray-700"
                  >
                    Total:
                  </td>
                  <td className="py-3 px-4 text-center text-sm font-bold text-gray-900">
                    {summary.totalQuantity}
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-bold text-gray-900">
                    {formatCurrency(summary.subTotalDiskon)}
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-bold text-gray-900">
                    {formatCurrency(summary.subTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors flex items-center"
            >
              <Printer className="h-5 w-5 mr-1" />
              Cetak
            </button>
          </div>
        </>
      )}
    </div>
  );
}
