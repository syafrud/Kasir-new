import { useState, useEffect } from "react";

interface Produk {
  id: number;
  nama_produk: string;
  barcode: string;
  harga_jual: number;
  stok: number;
}

interface SearchBarProps {
  onSelect: (produk: Produk) => void;
}

export default function SearchBarProduk({ onSelect }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProduk = async () => {
      if (searchTerm.length < 1) {
        setProdukList([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/produk?search=${searchTerm}`);
        const data = await res.json();
        console.log(data);
        setProdukList(data.produk);
      } catch (error) {
        console.error("Error fetching produk:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounceFetch = setTimeout(fetchProduk, 300);
    return () => clearTimeout(debounceFetch);
  }, [searchTerm]);

  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder="Cari produk (nama atau barcode)..."
        className="border rounded-lg p-2 w-full pr-10"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Tombol silang untuk menghapus pencarian */}
      {searchTerm && (
        <button
          onClick={() => {
            setSearchTerm("");
            setProdukList([]);
          }}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700"
        >
          ✕
        </button>
      )}

      {loading && <p className="text-sm text-gray-500">Mencari...</p>}

      {produkList.length > 0 && (
        <ul className="absolute bg-white border rounded-lg w-full mt-1 max-h-60 overflow-auto z-20">
          {produkList.map((produk) => (
            <li
              key={produk.id}
              onClick={() => onSelect(produk)}
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              <p className="font-semibold">{produk.nama_produk}</p>
              <p className="text-sm text-gray-500">Barcode: {produk.barcode}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
