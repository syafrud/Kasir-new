// components/EventProductsModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Search, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Product {
  id: number;
  nama_produk: string;
  harga_jual: number;
  stok: number;
}

interface EventProduct {
  id: number;
  id_event: number;
  id_produk: number;
  diskon: number;
  produk: Product;
}

interface EventProductsModalProps {
  eventId: number;
  eventName: string;
  onClose: () => void;
}

export default function EventProductsModal({
  eventId,
  eventName,
  onClose,
}: EventProductsModalProps) {
  const [eventProducts, setEventProducts] = useState<EventProduct[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [discount, setDiscount] = useState<string>("0");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"current" | "add">("current");

  const fetchEventProducts = async () => {
    try {
      const res = await fetch(`/api/event/${eventId}/product`);
      if (!res.ok) throw new Error("Failed to fetch event products");
      const data = await res.json();
      setEventProducts(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load event products");
    }
  };

  const fetchAvailableProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/event/${eventId}/available-products?search=${encodeURIComponent(
          search
        )}`
      );
      if (!res.ok) throw new Error("Failed to fetch available products");
      const data = await res.json();
      setAvailableProducts(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load available products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventProducts();
  }, [eventId]);

  useEffect(() => {
    if (activeTab === "add") {
      fetchAvailableProducts();
    }
  }, [activeTab, search]);

  const handleAddProduct = async () => {
    if (!selectedProduct) {
      toast.error("Please select a product");
      return;
    }

    try {
      const discountValue = parseFloat(discount);
      if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
        toast.error("Discount must be between 0 and 100");
        return;
      }

      const res = await fetch(`/api/event/${eventId}/product`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_produk: selectedProduct,
          diskon: discountValue,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add product");
      }

      toast.success("Product added to event");
      setSelectedProduct(null);
      setDiscount("0");
      fetchEventProducts();
      setActiveTab("current");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to add product");
    }
  };

  const handleUpdateDiscount = async (id: number, newDiscount: string) => {
    try {
      const discountValue = parseFloat(newDiscount);
      if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
        toast.error("Discount must be between 0 and 100");
        return;
      }

      const res = await fetch(`/api/event/product/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          diskon: discountValue,
        }),
      });

      if (!res.ok) throw new Error("Failed to update discount");

      setEventProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === id ? { ...product, diskon: discountValue } : product
        )
      );

      toast.success("Discount updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update discount");
    }
  };

  const handleRemoveProduct = async (id: number) => {
    if (
      !confirm("Are you sure you want to remove this product from the event?")
    )
      return;

    try {
      const res = await fetch(`/api/event/product/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove product");

      setEventProducts((prevProducts) =>
        prevProducts.filter((product) => product.id !== id)
      );

      toast.success("Product removed from event");
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove product");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-xl font-bold">{eventName} - Products</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="border-b">
          <div className="flex">
            <button
              className={`px-4 py-2 ${
                activeTab === "current"
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("current")}
            >
              Current Products
            </button>
            <button
              className={`px-4 py-2 ${
                activeTab === "add"
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("add")}
            >
              Add Products
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "current" ? (
            <div>
              {eventProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No products added to this event yet
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Product Name</th>
                      <th className="border p-2 text-right">Price</th>
                      <th className="border p-2 text-center">Discount (%)</th>
                      <th className="border p-2 text-right">Final Price</th>
                      <th className="border p-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventProducts.map((item) => {
                      const finalPrice =
                        Number(item.produk.harga_jual) *
                        (1 - Number(item.diskon) / 100);

                      return (
                        <tr key={item.id}>
                          <td className="border p-2">
                            {item.produk.nama_produk}
                          </td>
                          <td className="border p-2 text-right">
                            {Number(item.produk.harga_jual).toLocaleString()}
                          </td>
                          <td className="border p-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="w-full text-center border rounded p-1"
                              value={item.diskon}
                              onChange={(e) => {
                                const newDiscount = e.target.value;
                                setEventProducts((prevProducts) =>
                                  prevProducts.map((product) =>
                                    product.id === item.id
                                      ? {
                                          ...product,
                                          diskon: parseFloat(newDiscount) || 0,
                                        }
                                      : product
                                  )
                                );
                              }}
                              onBlur={(e) =>
                                handleUpdateDiscount(item.id, e.target.value)
                              }
                            />
                          </td>
                          <td className="border p-2 text-right">
                            {finalPrice.toLocaleString()}
                          </td>
                          <td className="border p-2 text-center">
                            <button
                              onClick={() => handleRemoveProduct(item.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div>
              <div className="flex mb-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full p-2 border rounded-lg pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Search
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={18}
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-4">Loading products...</div>
              ) : availableProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No products available or all products are already added
                </div>
              ) : (
                <div>
                  <table className="w-full border-collapse mb-4">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Product Name</th>
                        <th className="border p-2 text-right">Price</th>
                        <th className="border p-2 text-center">Stock</th>
                        <th className="border p-2 text-center">Select</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableProducts.map((product) => (
                        <tr
                          key={product.id}
                          className={
                            selectedProduct === product.id ? "bg-blue-50" : ""
                          }
                        >
                          <td className="border p-2">{product.nama_produk}</td>
                          <td className="border p-2 text-right">
                            {Number(product.harga_jual).toLocaleString()}
                          </td>
                          <td className="border p-2 text-center">
                            {product.stok}
                          </td>
                          <td className="border p-2 text-center">
                            <input
                              type="radio"
                              name="selectedProduct"
                              checked={selectedProduct === product.id}
                              onChange={() => setSelectedProduct(product.id)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {selectedProduct && (
                    <div className="border p-4 rounded-lg bg-gray-50">
                      <h3 className="font-medium mb-2">Set Discount:</h3>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="w-full p-2 border rounded"
                            value={discount}
                            onChange={(e) => setDiscount(e.target.value)}
                            placeholder="Enter discount percentage"
                          />
                        </div>
                        <button
                          onClick={handleAddProduct}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
                        >
                          <Plus size={18} />
                          Add Product
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
