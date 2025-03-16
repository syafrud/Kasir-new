// components/search/pelangganSearch.tsx
import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";

interface Pelanggan {
  id: number;
  nama: string;
}

interface PelangganSearchProps {
  onSelect: (pelanggan: Pelanggan) => void;
  selectedId?: string;
}

const PelangganSearch: React.FC<PelangganSearchProps> = ({
  onSelect,
  selectedId,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [pelanggan, setPelanggan] = useState<Pelanggan[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPelanggan, setSelectedPelanggan] = useState<Pelanggan | null>(
    null
  );
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch selected pelanggan if selectedId is provided
    if (selectedId) {
      const fetchPelanggan = async () => {
        try {
          const response = await fetch(`/api/penjualan/pelanggan`);
          if (!response.ok) throw new Error("Failed to fetch pelanggan");
          const data = await response.json();
          const pelanggan = data.pelanggan.find(
            (p: Pelanggan) => p.id.toString() === selectedId
          );
          if (pelanggan) {
            setSelectedPelanggan(pelanggan);
            setSearchTerm(pelanggan.nama);
          }
        } catch (error) {
          console.error("Error fetching pelanggan:", error);
        }
      };
      fetchPelanggan();
    }
  }, [selectedId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);

    if (term.length < 2) {
      setPelanggan([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/penjualan/pelanggan?search=${term}`);
      if (!response.ok) throw new Error("Failed to fetch pelanggan");
      const data = await response.json();
      setPelanggan(data.pelanggan);
      setShowResults(true);
    } catch (error) {
      console.error("Error searching pelanggan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (pelanggan: Pelanggan) => {
    setSelectedPelanggan(pelanggan);
    setSearchTerm(pelanggan.nama);
    setShowResults(false);
    onSelect(pelanggan);
  };

  return (
    <div ref={searchRef} className="relative">
      <label className="block text-gray-700 font-medium text-sm mb-1">
        Pelanggan
      </label>
      <div className="relative">
        <input
          type="text"
          className="border rounded-lg p-2 w-full pl-10"
          placeholder="Cari pelanggan..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
          <Search size={16} />
        </div>
      </div>

      {showResults && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-2 text-center text-gray-500">Loading...</div>
          ) : pelanggan.length > 0 ? (
            pelanggan.map((p) => (
              <div
                key={p.id}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelect(p)}
              >
                {p.nama}
              </div>
            ))
          ) : (
            <div className="p-2 text-center text-gray-500">
              No pelanggan found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PelangganSearch;
