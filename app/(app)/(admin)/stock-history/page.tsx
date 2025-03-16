"use client";

import { useState, useEffect, useRef } from "react";
import { format, parseISO } from "date-fns";

interface StockHistory {
  id: number;
  id_produk: number;
  stockIN: number;
  stockOut: number;
  created_at: string;
  produk: {
    id: number;
    nama_produk: string;
    kategori: {
      id: number;
      nama_kategori: string;
    };
  };
}

interface Category {
  id: number;
  nama_kategori: string;
}

interface Product {
  id: number;
  nama_produk: string;
  id_kategori: number;
}

export default function StockHistoryPage() {
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk nilai yang dipilih
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  // State untuk nilai yang diketik di input
  const [categoryInput, setCategoryInput] = useState<string>("");
  const [productInput, setProductInput] = useState<string>("");

  // State untuk menampilkan dropdown
  const [showCategoryDropdown, setShowCategoryDropdown] =
    useState<boolean>(false);
  const [showProductDropdown, setShowProductDropdown] =
    useState<boolean>(false);

  // State untuk kategori dan produk yang difilter berdasarkan input
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Refs untuk dropdown
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const categoryRes = await fetch("/api/stock-history/categories");
        if (!categoryRes.ok) {
          throw new Error(`Error fetching categories: ${categoryRes.status}`);
        }
        const categoryData = await categoryRes.json();
        setCategories(Array.isArray(categoryData) ? categoryData : []);

        const productRes = await fetch("/api/stock-history/produk");
        if (!productRes.ok) {
          throw new Error(`Error fetching products: ${productRes.status}`);
        }
        const productData = await productRes.json();
        setProducts(Array.isArray(productData) ? productData : []);
        setStockHistory([]);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setError("Failed to fetch initial data");
        setCategories([]);
        setProducts([]);
        setStockHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Tambahkan event listener untuk menutup dropdown saat klik di luar
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCategoryDropdown(false);
      }
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter kategori berdasarkan input
  useEffect(() => {
    if (categoryInput) {
      const filtered = categories.filter((category) =>
        category.nama_kategori
          .toLowerCase()
          .includes(categoryInput.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [categoryInput, categories]);

  // Filter produk berdasarkan kategori yang dipilih dan update produk ketika kategori berubah
  useEffect(() => {
    const fetchProductsByCategory = async () => {
      try {
        if (selectedCategory) {
          const response = await fetch(
            `/api/stock-history/produk?categoryId=${selectedCategory}`
          );
          if (!response.ok) {
            throw new Error(`Error fetching products: ${response.status}`);
          }
          const data = await response.json();
          setFilteredProducts(Array.isArray(data) ? data : []);

          if (
            selectedProduct &&
            !data.some((p: Product) => p.id.toString() === selectedProduct)
          ) {
            setSelectedProduct("");
            setProductInput("");
          }
        } else {
          setFilteredProducts(products);
        }
      } catch (error) {
        console.error("Error fetching products by category:", error);
        setFilteredProducts([]);
      }
    };

    fetchProductsByCategory();
  }, [selectedCategory, products, selectedProduct]);

  // Filter produk berdasarkan input
  useEffect(() => {
    if (productInput) {
      const inputFiltered = filteredProducts.filter((product) =>
        product.nama_produk.toLowerCase().includes(productInput.toLowerCase())
      );
      setFilteredProducts(inputFiltered);
    }
  }, [productInput]);

  const applyFilters = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = "/api/stock-history?";
      const params = [];

      if (selectedCategory) params.push(`categoryId=${selectedCategory}`);
      if (selectedProduct) params.push(`productId=${selectedProduct}`);
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);

      url += params.join("&");

      if (params.length === 0) {
        setStockHistory([]);
        setLoading(false);
        return;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error fetching stock history: ${response.status}`);
      }

      const data = await response.json();
      setStockHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching filtered stock history:", error);
      setError("Failed to fetch stock history data");
      setStockHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedProduct("");
    setCategoryInput("");
    setProductInput("");
    setStartDate("");
    setEndDate("");
    setStockHistory([]);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";

    try {
      return format(parseISO(dateString), "dd/MM/yyyy");
    } catch (error) {
      console.error("Invalid date:", dateString);
      return "Invalid date";
    }
  };

  // Handler untuk memilih kategori dari dropdown
  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category.id.toString());
    setCategoryInput(category.nama_kategori);
    setShowCategoryDropdown(false);
    // Reset produk ketika kategori berubah
    setSelectedProduct("");
    setProductInput("");
  };

  // Handler untuk memilih produk dari dropdown
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product.id.toString());
    setProductInput(product.nama_produk);
    setShowProductDropdown(false);
  };

  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-6">Stock History</h1>

      {/* Filter Form */}
      <div className="bg-white rounded-lg p-4">
        <form onSubmit={handleFilterSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4 items-end">
            {/* Category Filter with Autocomplete */}
            <div className="relative" ref={categoryDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Category
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Search category..."
                value={categoryInput}
                onChange={(e) => {
                  setCategoryInput(e.target.value);
                  setShowCategoryDropdown(true);
                  if (e.target.value === "") {
                    setSelectedCategory("");
                  }
                }}
                onFocus={() => setShowCategoryDropdown(true)}
              />
              {showCategoryDropdown && filteredCategories.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md max-h-60 overflow-y-auto">
                  {filteredCategories.map((category) => (
                    <div
                      key={category.id}
                      onClick={() => handleSelectCategory(category)}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {category.nama_kategori}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Filter with Autocomplete */}
            <div className="relative" ref={productDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Search product..."
                value={productInput}
                onChange={(e) => {
                  setProductInput(e.target.value);
                  setShowProductDropdown(true);
                  if (e.target.value === "") {
                    setSelectedProduct("");
                  }
                }}
                onFocus={() => setShowProductDropdown(true)}
              />
              {showProductDropdown && filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md max-h-60 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {product.nama_produk}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 h-2/3 ">
              <button
                type="button"
                onClick={clearFilters}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md w-1/2"
              >
                Clear Filters
              </button>
              <button
                type="submit"
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md w-1/2"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>Error: {error}</p>
        </div>
      )}

      {/* Stock History Table */}
      <div className="bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Out
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : stockHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    No stock history found
                  </td>
                </tr>
              ) : (
                stockHistory.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.produk?.kategori?.nama_kategori || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.produk?.nama_produk || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {Number(item.stockIN) || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {Number(item.stockOut) || 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
