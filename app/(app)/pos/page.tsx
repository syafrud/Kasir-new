"use client";

import { useState, useEffect } from "react";
import {
  X,
  Search,
  Trash2,
  CheckCircle,
  Printer,
  Plus,
  Minus,
  UserPlus,
} from "lucide-react";
import Image from "next/image";
import { createPenjualan } from "@/app/api/penjualan/actions";
import { useSession } from "next-auth/react";
import { NotaPrint } from "@/components/print/NotaPrint";
import { PrintInvoice } from "@/components/print/PrintInvoice";
import { createPelanggan } from "@/app/api/pelanggan/actions";
import toast from "react-hot-toast";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

interface Produk {
  id: number;
  nama_produk: string;
  harga_jual: number;
  stok: number;
  barcode: number;
  image?: string;
}

interface Customer {
  id: number;
  nama: string;
  alamat: string;
  hp: string;
  status: string;
}

export default function SalesPage() {
  const { data: session } = useSession();
  const [pageSize, setPageSize] = useState(5);
  const [products, setProducts] = useState<Produk[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<
    (Produk & { quantity: number })[]
  >([]);
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");
  const [isUmumModalOpen, setIsUmumModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
  });
  const [paymentDetails, setPaymentDetails] = useState({
    cash: 0,
    adjustment: 0,
    change: 0,
  });
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    nama: "",
    alamat: "",
    hp: "",
    status: "active",
  });
  const [formError, setFormError] = useState("");
  const [productPagination, setProductPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
  });
  const [productPageSize, setProductPageSize] = useState(10);

  const fetchInitialData = async () => {
    try {
      const [produkResponse, customerResponse] = await Promise.all([
        fetch(`/api/produk?page=1&limit=${productPageSize}`),
        fetch("/api/pelanggan"),
      ]);

      const produkData = await produkResponse.json();
      const customerData = await customerResponse.json();

      setProducts(produkData.produk);
      setCustomers(customerData.pelanggan);
      setFilteredCustomers(customerData.pelanggan);

      setPagination({
        totalCount: customerData.totalCount,
        totalPages: customerData.totalPages,
        currentPage: customerData.currentPage,
      });

      setProductPagination({
        totalCount: produkData.totalCount || 0,
        totalPages: produkData.totalPages || 1,
        currentPage: produkData.currentPage || 1,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const filtered = customers.filter(
      (customer) =>
        customer.nama
          .toLowerCase()
          .includes(customerSearchTerm.toLowerCase()) ||
        customer.hp.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        customer.alamat.toLowerCase().includes(customerSearchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [customerSearchTerm, customers]);

  const calculateSubTotal = () => {
    return selectedProducts.reduce(
      (total, product) => total + product.harga_jual * product.quantity,
      0
    );
  };

  const calculateDiscount = () => {
    return selectedCustomer ? calculateSubTotal() * 0.1 : 0;
  };

  const calculateTotal = () => {
    const subTotal = calculateSubTotal();
    const discount = calculateDiscount();
    const adjustment = paymentDetails.adjustment || 0;
    return subTotal - discount + adjustment;
  };

  const handleCashPayment = (value: number) => {
    const total = calculateTotal();
    setPaymentDetails((prev) => ({
      ...prev,
      cash: value || 0,
      change: (value || 0) - total,
    }));
  };

  const addProductToSale = (product: Produk) => {
    const existingProduct = selectedProducts.find((p) => p.id === product.id);
    if (existingProduct) {
      setSelectedProducts(
        selectedProducts.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        )
      );
    } else {
      setSelectedProducts([
        ...selectedProducts,
        {
          ...product,
          quantity: 1,
        },
      ]);
    }
  };

  const removeProduct = (productId: number) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
  };

  const clearAllProducts = () => {
    setSelectedProducts([]);
    setSelectedCustomer(null);
    setPaymentDetails({ cash: 0, adjustment: 0, change: 0 });
    fetchInitialData();
  };

  const handlePaymentConfirmation = async () => {
    if (!session?.user?.id) {
      alert("Silakan login terlebih dahulu");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("diskon", calculateDiscount().toString());
      formData.append("total_harga", calculateSubTotal().toString());
      formData.append("penyesuaian", paymentDetails.adjustment.toString());
      formData.append("total_bayar", paymentDetails.cash.toString());
      formData.append("kembalian", paymentDetails.change.toString());
      formData.append("id_user", session.user.id);
      formData.append("id_pelanggan", selectedCustomer?.id.toString() || "");
      formData.append("tanggal_penjualan", new Date().toISOString());
      formData.append(
        "selectedProduk",
        JSON.stringify(
          selectedProducts.map((product) => ({
            id: product.id,
            quantity: product.quantity,
          }))
        )
      );

      const response = await createPenjualan(formData);
      const newSaleId = response?.id;

      if (newSaleId) {
        setLastSaleId(newSaleId);
        setPaymentConfirmed(true);
        fetchInitialData();
      } else {
        throw new Error("Failed to get sale ID");
      }
    } catch (error) {
      console.error("Error processing sale:", error);
      alert("Gagal memproses penjualan. Silakan coba lagi.");
    }
  };

  const handleAddCustomer = async () => {
    setFormError("");

    if (!newCustomer.nama || !newCustomer.alamat || !newCustomer.hp) {
      setFormError("Semua field harus diisi");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("nama", newCustomer.nama);
      formData.append("alamat", newCustomer.alamat);
      formData.append("hp", newCustomer.hp);
      formData.append("status", newCustomer.status);

      await createPelanggan(formData);

      setNewCustomer({
        nama: "",
        alamat: "",
        hp: "",
        status: "active",
      });

      setIsAddCustomerModalOpen(false);

      fetchInitialData();
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError("Terjadi kesalahan saat menambahkan pelanggan");
      }
      console.error("Error adding customer:", error);
    }
  };

  const handlePrintNota = () => {
    if (lastSaleId) {
      NotaPrint(lastSaleId);
    }
  };

  const handlePrintInvoice = () => {
    if (lastSaleId) {
      PrintInvoice(lastSaleId);
    }
  };

  const openPaymentModal = () => {
    setIsPaymentModalOpen(true);
  };

  const filteredProducts = products.filter(
    (product) =>
      product.nama_produk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.toString().includes(searchTerm))
  );

  const handleAdjustmentChange = (value: number) => {
    setPaymentDetails((prev) => ({
      ...prev,
      adjustment: value || 0,
    }));
  };

  const updateProductQuantity = (productId: number, newQuantity: number) => {
    const product = products.find((p) => p.id === productId);
    const maxQuantity = product ? product.stok : 0;

    if (newQuantity >= 0 && newQuantity <= maxQuantity) {
      setSelectedProducts((currentProducts) =>
        currentProducts
          .map((p) =>
            p.id === productId ? { ...p, quantity: newQuantity } : p
          )
          .filter((p) => p.quantity > 0)
      );
    }
  };

  const incrementQuantity = (productId: number) => {
    const product = selectedProducts.find((p) => p.id === productId);
    if (product) {
      updateProductQuantity(productId, product.quantity + 1);
    }
  };

  const decrementQuantity = (productId: number) => {
    const product = selectedProducts.find((p) => p.id === productId);
    if (product) {
      updateProductQuantity(productId, product.quantity - 1);
    }
  };

  const handlePreviousPage = async () => {
    if (pagination.currentPage > 1) {
      fetchPaginatedData(pagination.currentPage - 1);
    }
  };

  const handleNextPage = async () => {
    if (pagination.currentPage < pagination.totalPages) {
      fetchPaginatedData(pagination.currentPage + 1);
    }
  };

  const fetchPaginatedData = async (page = 1, size = pageSize) => {
    try {
      const response = await fetch(`/api/pelanggan?page=${page}&limit=${size}`);
      const data = await response.json();

      setCustomers(data.pelanggan);
      setPagination({
        totalCount: data.totalCount,
        totalPages: data.totalPages,
        currentPage: data.currentPage,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    fetchPaginatedData(1, newSize);
  };

  const fetchProductPage = async (page = 1, size = productPageSize) => {
    try {
      const response = await fetch(`/api/produk?page=${page}&limit=${size}`);
      const data = await response.json();

      setProducts(data.produk);
      setProductPagination({
        totalCount: data.totalCount,
        totalPages: data.totalPages,
        currentPage: data.currentPage,
      });
    } catch (error) {
      console.error("Error fetching product data:", error);
    }
  };

  const handleProductPreviousPage = () => {
    if (productPagination.currentPage > 1) {
      fetchProductPage(productPagination.currentPage - 1);
    }
  };

  const handleProductNextPage = () => {
    if (productPagination.currentPage < productPagination.totalPages) {
      fetchProductPage(productPagination.currentPage + 1);
    }
  };

  const handleProductPageSizeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newSize = parseInt(e.target.value);
    setProductPageSize(newSize);
    fetchProductPage(1, newSize);
  };

  const handleBarcodeInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const barcode = e.target.value.trim();

    if (barcode.length > 11) {
      try {
        const response = await fetch(`/api/produk/barcode/${barcode}`);

        if (response.ok) {
          const data = await response.json();
          if (data.produk) {
            addProductToSale(data.produk);
            setSearchTerm("");
          } else {
            toast.error(`Produk dengan barcode ${barcode} tidak ditemukan`);
          }
        } else {
          toast.error("Error fetching product by barcode");
        }
      } catch (error) {
        toast.error("Gagal mencari produk! Coba lagi.");
        console.error("Error mencari produk:", error);
      }
    }
  };

  return (
    <div className="flex  h-[calc(100vh-62px)]  p-4">
      {/* Products Column */}
      <div className="w-1/2 p-4 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <select
              className="border p-2"
              value={productPageSize}
              onChange={handleProductPageSizeChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
          <div className="flex items-center relative flex-1">
            <div className="flex items-center relative flex-1">
              <input
                type="text"
                placeholder="Scan Barcode atau Cari Barang"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  const input = e.target.value.trim();

                  if (input.length > 11) {
                    handleBarcodeInput(e);
                  }
                }}
                className="w-full pl-10 border-2 p-2"
                autoFocus
              />
              <Search className="absolute left-3 text-gray-400" size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white h-full p-4 flex flex-col">
          <div className="overflow-y-auto flex-grow max-h-[calc(100vh-280px)]">
            <table className="w-full ">
              <thead>
                <tr className="border-b-2">
                  <th className="p-2 text-left">Foto</th>
                  <th className="p-2 text-center">Barang</th>
                  <th className="p-2 text-right">Harga</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b cursor-pointer hover:bg-gray-100 text-center"
                    onClick={() => addProductToSale(product)}
                  >
                    <td className="p-2">
                      <Image
                        src={product.image || "/placeholder.jpg"}
                        alt={product?.nama_produk || ""}
                        width={100}
                        height={100}
                        className="w-16 object-cover rounded-md"
                      />
                    </td>
                    <td className="p-2">
                      <div>{product.nama_produk}</div>
                      <div className="text-green-600">{product.stok}</div>
                    </td>
                    <td className="p-2 text-right">
                      Rp. {product.harga_jual.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Product Pagination Controls */}
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm">
                Showing {Math.min(productPageSize, filteredProducts.length)} of{" "}
                {productPagination.totalCount} products
              </span>
              <div>
                <button
                  className={`mr-2 px-3 py-1 border rounded ${
                    productPagination.currentPage === 1
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={handleProductPreviousPage}
                  disabled={productPagination.currentPage === 1}
                >
                  Previous
                </button>
                <span className="mx-2">
                  Page {productPagination.currentPage} of{" "}
                  {productPagination.totalPages}
                </span>
                <button
                  className={`px-3 py-1 border rounded ${
                    productPagination.currentPage ===
                    productPagination.totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={handleProductNextPage}
                  disabled={
                    productPagination.currentPage ===
                    productPagination.totalPages
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sale Details Column */}
      <div className="w-1/2 p-4">
        <div className="bg-white p-4 rounded-lg h-full flex flex-col">
          {selectedProducts.length === 0 ? (
            <div className="text-center text-gray-500 my-auto">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-blue-600 font-semibold mb-2">Petunjuk</h3>
                <ul className="text-left list-disc list-inside space-y-2 text-sm">
                  <li>Untuk memulai silakan pilih barang di samping</li>
                  <li>Klik nama untuk memilih pelanggan</li>
                  <li>Gunakan tombol + untuk menambah kuantitas</li>
                  <li>Gunakan tombol - untuk mengurangi kuantitas</li>
                </ul>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3
                    className="text-lg font-semibold cursor-pointer"
                    onClick={() => setIsUmumModalOpen(true)}
                  >
                    {selectedCustomer ? selectedCustomer.nama : "Umum"}
                  </h3>
                </div>
                {selectedCustomer && (
                  <button
                    className=" text-red-500"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    Batalkan Pelanggan
                  </button>
                )}
              </div>

              <div className="flex-grow overflow-y-auto">
                {selectedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center mb-2 pb-2 border-b"
                  >
                    <div>
                      <p className="font-semibold">{product.nama_produk}</p>
                      <p>Rp. {product.harga_jual.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        className=""
                        onClick={() => decrementQuantity(product.id)}
                      >
                        <Minus size={16} />
                      </button>
                      <input
                        type="number"
                        value={product.quantity}
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value);
                          updateProductQuantity(
                            product.id,
                            isNaN(newQuantity) ? 0 : newQuantity
                          );
                        }}
                        className=" w-16 text-center"
                        min="0"
                        max={
                          products.find((p) => p.id === product.id)?.stok || 0
                        }
                      />
                      <button onClick={() => incrementQuantity(product.id)}>
                        <Plus size={16} />
                      </button>
                      <button onClick={() => removeProduct(product.id)}>
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span>Sub Total</span>
                  <span>Rp. {calculateSubTotal().toLocaleString()}</span>
                </div>
                {selectedCustomer && (
                  <div className="flex justify-between mb-2">
                    <span>Diskon (10%)</span>
                    <span>- Rp. {calculateDiscount().toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between mb-2">
                  <span>Penyesuaian</span>
                  <input
                    type="number"
                    placeholder="Masukkan Penyesuaian"
                    value={paymentDetails.adjustment}
                    onChange={(e) =>
                      handleAdjustmentChange(parseFloat(e.target.value))
                    }
                    className=" w-[150px] text-right"
                  />
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>Rp. {calculateTotal().toLocaleString()}</span>
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex justify-between mb-2">
                    <span>Bayar</span>
                    <input
                      type="number"
                      placeholder="Masukkan Jumlah Bayar"
                      value={paymentDetails.cash}
                      onChange={(e) =>
                        handleCashPayment(parseFloat(e.target.value))
                      }
                      className=" w-[150px] text-right"
                    />
                  </div>
                  {paymentDetails.cash > 0 && (
                    <div className="flex justify-between">
                      <span>Kembalian</span>
                      <span>Rp. {paymentDetails.change.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-row h-10 mt-2">
                  <button
                    className="flex items-center w-3/12 bg-[rgba(255,0,57,0.3)] hover:bg-[rgba(255,0,57,0.4)] text-[rgba(255,0,57,0.7)] justify-center"
                    onClick={() => clearAllProducts()}
                  >
                    <Trash2 />
                  </button>
                  <button
                    className="flex items-center w-9/12 bg-[#2780e3] hover:bg-[#216dc1] text-white justify-center"
                    disabled={
                      selectedProducts.length === 0 ||
                      paymentDetails.cash < calculateTotal()
                    }
                    onClick={openPaymentModal}
                  >
                    Bayar Rp {calculateTotal().toLocaleString()}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px] p-6">
            {!paymentConfirmed ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    Konfirmasi Pembayaran
                  </h2>
                  <button
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Sub Total</span>
                    <span>Rp. {calculateSubTotal().toLocaleString()}</span>
                  </div>
                  {selectedCustomer && (
                    <div className="flex justify-between">
                      <span>Diskon (10%)</span>
                      <span>- Rp. {calculateDiscount().toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Penyesuaian</span>
                    <span>
                      Rp. {paymentDetails.adjustment.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>Rp. {calculateTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bayar</span>
                    <span>Rp. {paymentDetails.cash.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kembalian</span>
                    <span>Rp. {paymentDetails.change.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <button onClick={() => setIsPaymentModalOpen(false)}>
                    Batal
                  </button>
                  <button
                    onClick={handlePaymentConfirmation}
                    disabled={paymentDetails.cash < calculateTotal()}
                  >
                    Konfirmasi Pembayaran
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <CheckCircle
                  size={64}
                  className="mx-auto text-green-500 mb-4"
                />
                <h2 className="text-2xl font-bold text-green-600 mb-2">
                  Pembayaran Berhasil
                </h2>
                <p className="text-gray-600 mb-6">
                  Transaksi telah selesai dan disimpan.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handlePrintNota}
                    className=" flex items-center"
                  >
                    <Printer className="mr-2" size={20} /> Cetak Nota
                  </button>
                  <button
                    onClick={handlePrintInvoice}
                    className=" flex items-center"
                  >
                    <Printer className="mr-2" size={20} /> Cetak Invoice
                  </button>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      clearAllProducts();
                      setIsPaymentModalOpen(false);
                      setPaymentConfirmed(false);
                    }}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {isUmumModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[600px] max-h-[80vh] flex flex-col">
            {/* Fixed header */}
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Pilih Customer</h2>
              <button
                onClick={() => setIsUmumModalOpen(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <X size={24} />
              </button>
            </div>

            {/* Controls area (fixed) */}
            <div className="p-4 border-b">
              <div className="flex flex-row justify-center gap-4">
                <div className="flex items-center gap-2">
                  <select
                    className="flex border p-2"
                    value={pageSize}
                    onChange={handlePageSizeChange}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>
                <div className="flex flex-1 items-center gap-4">
                  <div className="flex flex-1">
                    <input
                      type="text"
                      placeholder="Cari Pelanggan"
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                      className="p-2 border-2 w-full"
                    />
                  </div>
                  <button
                    className="flex items-center gap-2 bg-green-500 text-white px-4 py-1 rounded-lg hover:bg-green-600 transition h-full"
                    onClick={() => setIsAddCustomerModalOpen(true)}
                  >
                    <UserPlus size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable table container */}
            <div className="px-4 overflow-y-auto flex-grow">
              <table className="w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b">
                    <th className="text-left p-2">No</th>
                    <th className="text-left p-2">Nama</th>
                    <th className="text-left p-2">Alamat</th>
                    <th className="text-left p-2">No. Hp</th>
                    <th className="text-right p-2">Pilih</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer, index) => (
                    <tr
                      key={customer.id}
                      className="border-b hover:bg-gray-100"
                    >
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{customer.nama}</td>
                      <td className="p-2">{customer.alamat}</td>
                      <td className="p-2">{customer.hp}</td>
                      <td className="p-2 text-right">
                        <button
                          className=""
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setIsUmumModalOpen(false);
                          }}
                        >
                          Pilih
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Fixed footer with pagination */}
            <div className="p-4 border-t">
              <div className="flex justify-between">
                <span>
                  Showing 1 to {filteredCustomers.length} of{" "}
                  {pagination.totalCount} entries
                </span>
                <div>
                  <button
                    className={`mr-2 ${
                      pagination.currentPage === 1
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    onClick={handlePreviousPage}
                    disabled={pagination.currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="mx-2">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    className={`${
                      pagination.currentPage === pagination.totalPages
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    onClick={handleNextPage}
                    disabled={pagination.currentPage === pagination.totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px] p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Tambah Pelanggan Baru</h2>
              <button
                onClick={() => setIsAddCustomerModalOpen(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <X size={24} />
              </button>
            </div>

            {formError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Nama Pelanggan
                </label>
                <input
                  type="text"
                  placeholder="Masukkan nama pelanggan"
                  value={newCustomer.nama}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, nama: e.target.value })
                  }
                  className=" border-2 w-full p-2"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Alamat
                </label>
                <textarea
                  placeholder="Masukkan alamat"
                  value={newCustomer.alamat}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, alamat: e.target.value })
                  }
                  className="p-2 border w-full"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  No. Handphone
                </label>
                <input
                  type="text"
                  placeholder="Masukkan nomor handphone"
                  value={newCustomer.hp}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, hp: e.target.value })
                  }
                  className="p-2 border-2 w-full"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Status
                </label>
                <select
                  value={newCustomer.status}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, status: e.target.value })
                  }
                  className="p-2 border w-full"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button onClick={() => setIsAddCustomerModalOpen(false)}>
                Batal
              </button>
              <button onClick={handleAddCustomer}>Simpan Pelanggan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
