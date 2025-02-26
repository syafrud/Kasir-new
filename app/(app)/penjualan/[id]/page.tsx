"use client";

import { useState, useEffect, useCallback } from "react";
import SearchBar from "@/components/search";
import { useParams } from "next/navigation";

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

export default function DetailPage() {
  const id = useParams()?.id;
  const [details, setDetail] = useState<Detail[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const fetchDetail = useCallback(async () => {
    try {
      if (!id) {
        setError("No ID provided");
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
      setDetail(data);
      setError("");
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to fetch details");
      setDetail([]);
    }
  }, [id, search]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

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

  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-4">Detail Penjualan</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="flex flex-row gap-5 items-center text-center mb-3">
        <SearchBar search={search} setSearch={setSearch} />
      </div>

      <table className="w-full border-collapse border border-gray-200 mt-6">
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
