// File: app/penjualan/[id]/print/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { use } from "react";

interface DetailPenjualan {
  id: number;
  id_penjualan: number;
  id_produk: number;
  harga_jual: string;
  qty: number;
  total_harga: string;
  tanggal_penjualan: Date;
  produk: {
    nama_produk: string;
    harga_jual: string;
  };
}

interface Penjualan {
  id: number;
  id_user: number;
  id_pelanggan: number | null;
  diskon: string;
  total_harga: string;
  tanggal_penjualan: Date;
  users: {
    nama_user: string;
  };
  pelanggan: {
    nama: string;
    alamat: string;
  } | null;
  detail_penjualan: DetailPenjualan[];
}

export default function PrintPage({ params }: { params: { id: string } }) {
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const router = useRouter();
  const [penjualan, setPenjualan] = useState<Penjualan | null>(null);
  const [isPrintingInvoice, setIsPrintingInvoice] = useState(false);
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPenjualan = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/penjualan/${id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch data");
        }
        const data = await res.json();
        setPenjualan(data);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPenjualan();
  }, [id]);

  // Format currency to Indonesian Rupiah
  const formatRupiah = (value: string) => {
    return `Rp ${parseInt(value).toLocaleString("id-ID")}`;
  };

  // Format date to Indonesian format
  const formatTanggal = (date: Date) => {
    const dateObj = new Date(date);

    return dateObj.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format time to Indonesian format
  const formatWaktu = (date: Date) => {
    const dateObj = new Date(date);

    return dateObj.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const handlePrintInvoice = () => {
    setIsPrintingInvoice(true);
    setTimeout(() => {
      window.print();
      setIsPrintingInvoice(false);
    }, 100);
  };

  const handlePrintReceipt = () => {
    setIsPrintingReceipt(true);
    setTimeout(() => {
      window.print();
      setIsPrintingReceipt(false);
    }, 100);
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  if (!penjualan) {
    return <div className="p-8 text-center">No data found</div>;
  }

  const totalDibayar = penjualan.detail_penjualan.reduce(
    (acc, item) => acc + parseInt(item.total_harga),
    0
  );

  const invoiceNumber = `0005/INV/IK/${new Date().getFullYear()}`;

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between">
        <button
          onClick={handleBack}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Back
        </button>
        <div className="space-x-4">
          <button
            onClick={handlePrintInvoice}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Print Invoice
          </button>
          <button
            onClick={handlePrintReceipt}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Print Receipt
          </button>
        </div>
      </div>

      {/* Invoice Template - only visible when printing invoice */}
      {isPrintingInvoice && (
        <div className="invoice-print">
          <div className="border border-gray-300 p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <div className="text-purple-500 mr-4">
                  <div className="text-3xl font-bold">IndoKasir</div>
                </div>
                <div>
                  <p className="font-bold">PT Indokasir Demo</p>
                  <p>Indokasir Demo Office</p>
                  <p>Jugo, Kesamben</p>
                  <p>Kabupaten Blitar, Jawa Timur</p>
                </div>
              </div>
              <div className="text-right">
                <div className="mb-2 inline-block bg-red-500 text-white px-4 py-1">
                  KURANG
                </div>
                <div className="border border-black p-1">
                  <div className="text-center">{invoiceNumber}</div>
                </div>
              </div>
            </div>

            <div className="text-center my-6">
              <h1 className="text-2xl font-bold">INVOICE</h1>
            </div>

            <div className="mb-6">
              <h2 className="font-bold mb-2">Pembeli</h2>
              <div className="grid grid-cols-2 gap-1">
                <div>Nama</div>
                <div>: {penjualan.pelanggan?.nama || "Umum"}</div>
                <div>Alamat</div>
                <div>: {penjualan.pelanggan?.alamat || "-"}</div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="font-bold mb-2">Transaksi</h2>
              <div className="text-right">
                {formatTanggal(penjualan.tanggal_penjualan)}{" "}
                {formatWaktu(penjualan.tanggal_penjualan)}
              </div>
              <table className="w-full border-collapse border border-gray-300 mt-2">
                <thead>
                  <tr>
                    <th className="border border-gray-300 p-2 text-left w-16">
                      No
                    </th>
                    <th className="border border-gray-300 p-2 text-left">
                      Deskripsi
                    </th>
                    <th className="border border-gray-300 p-2 text-center">
                      Kuantitas
                    </th>
                    <th className="border border-gray-300 p-2 text-center">
                      Harga Satuan
                    </th>
                    <th className="border border-gray-300 p-2 text-center">
                      Harga Total
                    </th>
                    <th className="border border-gray-300 p-2 text-center">
                      Diskon
                    </th>
                    <th className="border border-gray-300 p-2 text-center">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {penjualan.detail_penjualan.map((detail, index) => (
                    <tr key={detail.id}>
                      <td className="border border-gray-300 p-2 text-center">
                        {index + 1}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {detail.produk.nama_produk}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {detail.qty}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {formatRupiah(detail.harga_jual)}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {formatRupiah(detail.total_harga)}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        0
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {formatRupiah(detail.total_harga)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <table className="w-full border-collapse border border-gray-300 mt-4">
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2 font-bold">
                      Subtotal
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      {formatRupiah(penjualan.total_harga)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-bold">
                      Diskon
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      {formatRupiah(penjualan.diskon)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-bold">
                      Penyesuaian
                    </td>
                    <td className="border border-gray-300 p-2 text-right">0</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-bold">
                      Total
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      {formatRupiah(penjualan.total_harga)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-bold">
                      Total Bayar
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      {formatRupiah("5000")}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-bold">
                      Kurang
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      {formatRupiah(
                        (parseInt(penjualan.total_harga) - 5000).toString()
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mb-6">
              <h2 className="font-bold mb-2">Pembayaran</h2>
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-300 p-2 text-left w-16">
                      No
                    </th>
                    <th className="border border-gray-300 p-2 text-left">
                      Tanggal Pembayaran
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      Nominal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2 text-center">
                      1
                    </td>
                    <td className="border border-gray-300 p-2">
                      {formatTanggal(penjualan.tanggal_penjualan)}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      {formatRupiah("5000")}
                    </td>
                  </tr>
                  <tr>
                    <td
                      className="border border-gray-300 p-2 text-left font-bold"
                      colSpan={2}
                    >
                      Total
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      {formatRupiah("5000")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-center mt-12 pt-4 border-t border-gray-300">
              <p>
                Terima kasih telah berbelanja di tempat kami. Kepuasan Anda
                adalah tujuan kami.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Template - only visible when printing receipt */}
      {isPrintingReceipt && (
        <div className="receipt-print">
          <div className="max-w-sm mx-auto p-4">
            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-purple-500">
                IndoKasir
              </div>
              <p className="font-bold">PT Indokasir Demo</p>
              <p>Indokasir Demo Office</p>
              <p>Telp/WA 08134128703</p>
            </div>

            <div className="border-b border-dashed border-gray-400 pb-2">
              <div className="flex justify-between">
                <span>Tanggal</span>
                <span>
                  : {formatTanggal(penjualan.tanggal_penjualan).split(" ")[0]}{" "}
                  {formatWaktu(penjualan.tanggal_penjualan)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Kasir</span>
                <span>: {penjualan.users.nama_user}</span>
              </div>
              <div className="flex justify-between">
                <span>Plg</span>
                <span>: {penjualan.pelanggan?.nama || "Umum"}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-gray-400 py-2">
              {penjualan.detail_penjualan.map((detail) => (
                <div key={detail.id} className="mb-2">
                  <div>{detail.produk.nama_produk}</div>
                  <div className="flex justify-between">
                    <span>
                      {formatRupiah(detail.harga_jual)} x {detail.qty}
                    </span>
                    <span>{formatRupiah(detail.total_harga)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="py-2">
              <div className="flex justify-between">
                <span>Sub Total</span>
                <span>{formatRupiah(penjualan.total_harga)}</span>
              </div>
              <div className="flex justify-between">
                <span>Diskon</span>
                <span>{formatRupiah(penjualan.diskon)}</span>
              </div>
              <div className="flex justify-between">
                <span>Penyesuaian</span>
                <span>0</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Neto</span>
                <span>{formatRupiah(penjualan.total_harga)}</span>
              </div>
              <div className="flex justify-between">
                <span>Dibayar</span>
                <span>{formatRupiah("5000")}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Kurang</span>
                <span>
                  {formatRupiah(
                    (parseInt(penjualan.total_harga) - 5000).toString()
                  )}
                </span>
              </div>
            </div>

            <div className="text-center mt-4 text-sm">
              <p>Terima kasih telah berbelanja di</p>
              <p>tempat kami. Kepuasan Anda</p>
              <p>adalah tujuan kami.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
