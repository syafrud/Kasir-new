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
} from "lucide-react";
import Image from "next/image";
import { createPenjualan } from "@/app/api/penjualan/actions";
import { useSession } from "next-auth/react";
import { NotaPrint } from "@/components/print/NotaPrint";
import { PrintInvoice } from "@/components/print/PrintInvoice";

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
  const [products, setProducts] = useState<Produk[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<
    (Produk & { quantity: number })[]
  >([]);
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");
  const [isUmumModalOpen, setIsUmumModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
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

  const fetchInitialData = async () => {
    try {
      const [produkResponse, customerResponse] = await Promise.all([
        fetch("/api/produk"),
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

  const filteredProducts = products.filter((product) =>
    product.nama_produk.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="flex h-[calc(100vh-62px)] p-4">
      {/* Products Column */}
      <div className="w-1/2 p-4 flex flex-col gap-4">
        <div className="flex items-center relative">
          <input
            type="text"
            placeholder="Cari Produk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered w-full pl-10 border-2"
          />
          <Search className="absolute left-3 text-gray-400" size={20} />
        </div>
        <div className="rounded-lg bg-white h-full p-4">
          <table className="w-full">
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
                    className="btn btn-sm btn-ghost text-red-500"
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
                        className="btn btn-sm btn-outline"
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
                        className="input input-sm w-16 text-center"
                        min="0"
                        max={
                          products.find((p) => p.id === product.id)?.stok || 0
                        }
                      />
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => incrementQuantity(product.id)}
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        className="btn btn-sm btn-error"
                        onClick={() => removeProduct(product.id)}
                      >
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
                    className="input input-bordered w-[150px] text-right"
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
                      className="input input-bordered w-[150px] text-right"
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
                  <button
                    className="btn btn-ghost"
                    onClick={() => setIsPaymentModalOpen(false)}
                  >
                    Batal
                  </button>
                  <button
                    className="btn btn-primary"
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
                    className="btn btn-outline btn-primary flex items-center"
                  >
                    <Printer className="mr-2" size={20} /> Cetak Nota
                  </button>
                  <button
                    onClick={handlePrintInvoice}
                    className="btn btn-primary flex items-center"
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
                    className="btn btn-ghost"
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
          <div className="bg-white rounded-lg w-[600px] max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Pilih Customer</h2>
              <button
                onClick={() => setIsUmumModalOpen(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4">
              <div className="flex justify-between mb-4">
                <div>
                  <select
                    className="select select-bordered w-full max-w-xs"
                    defaultValue="10"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder="Cari Pelanggan"
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    className="input input-bordered w-full max-w-xs"
                  />
                </div>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">No</th>
                    <th className="text-left p-2">Nama</th>
                    <th className="text-left p-2">Alamat</th>
                    <th className="text-left p-2">No. Tip</th>
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
                          className="btn btn-sm btn-success"
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

              <div className="flex justify-between mt-4">
                <span>
                  Showing 1 to {customers.length} of {pagination.totalCount}{" "}
                  entries
                </span>
                <div>
                  <button className="btn btn-ghost btn-sm mr-2">
                    Previous
                  </button>
                  <button className="btn btn-ghost btn-sm">Next</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
