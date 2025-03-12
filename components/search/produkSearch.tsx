import Image from "next/image";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface Produk {
  id: number;
  nama_produk: string;
  barcode: string;
  harga_jual: number;
  stok: number;
  image: string;
}

export default function ProdukSearch({
  onSelect,
}: {
  onSelect: (produk: Produk) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(false);
  const [processedBarcode, setProcessedBarcode] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduk = async () => {
      if (searchTerm.length < 1) {
        setProdukList([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/produk?search=${searchTerm}`);
        if (!res.ok) throw new Error("Gagal mengambil data produk");
        const data = await res.json();
        setProdukList(data.produk);
      } catch (error) {
        console.error("Error fetching produk:", error);
        toast.error("Gagal mengambil data produk. Silakan coba lagi!");
      } finally {
        setLoading(false);
      }
    };
    const debounceFetch = setTimeout(fetchProduk, 300);
    return () => clearTimeout(debounceFetch);
  }, [searchTerm]);

  useEffect(() => {
    if (searchTerm.length > 11 && !isNaN(parseInt(searchTerm))) {
      handleBarcodeSearch(searchTerm);
    }
  }, [searchTerm]);

  const handleBarcodeSearch = async (barcode: string) => {
    if (processedBarcode === barcode) return;
    setProcessedBarcode(barcode);

    try {
      setSearchTerm("");
      const response = await fetch(`/api/produk/barcode/${barcode}`);
      const data = await response.json();

      if (response.ok) {
        if (data.produk) {
          onSelect(data.produk);
        } else {
          toast.error(`Produk dengan barcode ${barcode} tidak ditemukan`);
        }
      } else {
        switch (response.status) {
          case 400:
            toast.error("Barcode wajib diisi!");
            break;
          case 404:
            toast.error("Produk tidak ditemukan");
            break;
          case 500:
            toast.error("Terjadi kesalahan pada server. Coba lagi nanti.");
            break;
          default:
            toast.error("Terjadi kesalahan yang tidak diketahui.");
        }
      }
    } catch (error) {
      console.error("Error in barcode search:", error);
      toast.error("Tidak dapat terhubung ke server!");
    } finally {
      setTimeout(() => setProcessedBarcode(null), 500);
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder="Cari Produk/Barcode..."
        className="border rounded-lg p-2 w-full pr-10"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const barcode = e.currentTarget.value.trim();
            if (!isNaN(parseInt(barcode))) {
              handleBarcodeSearch(barcode);
            }
          }
        }}
      />
      {loading && <p className="text-sm text-gray-500">Mencari...</p>}
      {produkList.length > 0 && (
        <ul className="absolute bg-white border rounded-lg w-full mt-1 max-h-60 overflow-auto z-20">
          {produkList.map((produk) => (
            <li
              key={produk.id}
              onClick={() => onSelect(produk)}
              className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
            >
              <div className="w-16 h-16 flex-shrink-0">
                {produk.image ? (
                  <Image
                    src={produk.image}
                    alt={produk.nama_produk}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No Image</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{produk.nama_produk}</p>
                <p className="text-sm text-gray-500">
                  Barcode: {produk.barcode}
                </p>
                <p className="text-sm text-green-600">
                  Rp {produk.harga_jual.toLocaleString("id-ID")}
                </p>
                <p className="text-xs text-gray-500">Stok: {produk.stok}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
