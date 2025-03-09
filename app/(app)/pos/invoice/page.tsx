"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  Calendar,
  UserCheck,
  Edit,
  FileText,
  Mail,
} from "lucide-react";
import { format } from "date-fns";
import { NotaPrint } from "@/components/print/NotaPrint";
import { PrintInvoice } from "@/components/print/PrintInvoice";
import { updatePenjualan } from "@/app/api/penjualan/actions";

interface InvoiceItem {
  id: number;
  produk_nama: string;
  qty: number;
  harga_jual: number;
  subtotal: number;
}

interface Invoice {
  id: number;
  no_invoice: string;
  tgl_invoice: string;
  nama_customer: string;
  sub_total: number;
  diskon: number;
  neto: number;
  bayar: number;
  kembalian: number;
  penyesuaian: number;
  id_pelanggan?: number;
  items?: InvoiceItem[];
  tanggal_penjualan?: string | Date;
}

interface Customer {
  id: number;
  nama: string;
}

export default function SalesPage() {
  const { data: session } = useSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<string[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("Semua");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10,
  });
  const [loading, setLoading] = useState(false);
  const [dateFilterType, setDateFilterType] = useState<
    "daily" | "monthly" | "yearly" | "custom"
  >("daily");
  const [productSearchTerm, setProductSearchTerm] = useState<string>("");
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState<Invoice | null>(null);
  const [editedItems, setEditedItems] = useState<InvoiceItem[]>([]);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [showInvoiceCustomerDropdown, setShowInvoiceCustomerDropdown] =
    useState(false);
  const [showDetailCustomerDropdown, setShowDetailCustomerDropdown] =
    useState(false);

  const fetchCustomers = async (searchTerm: string) => {
    try {
      const response = await fetch(`/api/pelanggan?search=${searchTerm}`);
      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }
      const data = await response.json();
      const transformedCustomers = data.pelanggan.map((customer: Customer) => ({
        id: customer.id,
        name: customer.nama,
      }));
      setCustomerSearchResults(transformedCustomers);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/produk`);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();

      const formattedProducts = (data.produk || []).map(
        (product: {
          id: number;
          nama_produk: string;
          harga_jual?: number;
        }) => ({
          id: product.id,
          nama: product.nama_produk,
          harga_jual: product.harga_jual || 0,
        })
      );

      setProducts(formattedProducts);
      console.log("Fetched products:", formattedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    }
  };

  const handleEditClick = () => {
    if (selectedInvoice) {
      setEditedInvoice({ ...selectedInvoice });
      setEditedItems([...(selectedInvoice.items || [])]);
      fetchProducts();
      setIsEditMode(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleInvoiceChange = (field: string, value: any) => {
    if (editedInvoice) {
      const updatedInvoice = { ...editedInvoice, [field]: value };

      if (field === "nama_customer" && value) {
        const isRegisteredCustomer =
          customers.includes(value) && value !== "Semua";
        const discountRate = isRegisteredCustomer ? 0.1 : 0;
        updatedInvoice.diskon = updatedInvoice.sub_total * discountRate;
      }

      updatedInvoice.neto =
        updatedInvoice.sub_total -
        updatedInvoice.diskon +
        (updatedInvoice.penyesuaian || 0);

      if (updatedInvoice.bayar) {
        updatedInvoice.kembalian = updatedInvoice.bayar - updatedInvoice.neto;
      }

      setEditedInvoice(updatedInvoice);
    }
  };

  const handleItemChange = (itemId: number, field: string, value: any) => {
    const updatedItems = editedItems.map((item) => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        if (field === "qty" || field === "harga_jual") {
          updatedItem.subtotal =
            Number(updatedItem.qty) * Number(updatedItem.harga_jual);
        }
        return updatedItem;
      }
      return item;
    });

    setEditedItems(updatedItems);

    if (editedInvoice) {
      const subTotal = updatedItems.reduce(
        (sum, item) => sum + Number(item.subtotal),
        0
      );

      const isRegisteredCustomer =
        customers.includes(editedInvoice.nama_customer) &&
        editedInvoice.nama_customer !== "Semua";
      const discountRate = isRegisteredCustomer ? 0.1 : 0;
      const discount = subTotal * discountRate;

      const neto = subTotal - discount + (editedInvoice.penyesuaian || 0);
      let kembalian = 0;
      if (editedInvoice.bayar) {
        kembalian = editedInvoice.bayar - neto;
      }

      setEditedInvoice({
        ...editedInvoice,
        sub_total: subTotal,
        diskon: discount,
        neto: neto,
        kembalian: kembalian,
      });
    }
  };

  const handleRemoveItem = (itemId: number) => {
    const newEditedItems = editedItems.filter((item) => item.id !== itemId);
    setEditedItems(newEditedItems);

    if (editedInvoice) {
      const subTotal = newEditedItems.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );

      const isRegisteredCustomer =
        customers.includes(editedInvoice.nama_customer) &&
        editedInvoice.nama_customer !== "Semua";
      const discountRate = isRegisteredCustomer ? 0.1 : 0;
      const discount = subTotal * discountRate;

      const neto = subTotal - discount + (editedInvoice.penyesuaian || 0);
      let kembalian = 0;
      if (editedInvoice.bayar) {
        kembalian = editedInvoice.bayar - neto;
      }

      setEditedInvoice({
        ...editedInvoice,
        sub_total: subTotal,
        diskon: discount,
        neto: neto,
        kembalian: kembalian,
      });
    }
  };

  const handleAddProduct = (product: any) => {
    const existingItemIndex = editedItems.findIndex(
      (item) => item.id === product.id
    );

    let newEditedItems;
    if (existingItemIndex >= 0) {
      newEditedItems = editedItems.map((item, index) => {
        if (index === existingItemIndex) {
          const newQty = Number(item.qty) + 1;
          return {
            ...item,
            qty: newQty,
            subtotal: newQty * Number(item.harga_jual),
          };
        }
        return item;
      });
    } else {
      const newItem: InvoiceItem = {
        id: product.id,
        produk_nama: product.nama,
        qty: 1,
        harga_jual: Number(product.harga_jual),
        subtotal: Number(product.harga_jual),
      };
      newEditedItems = [...editedItems, newItem];
    }

    setEditedItems(newEditedItems);

    if (editedInvoice) {
      const subTotal = newEditedItems.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );

      const isRegisteredCustomer =
        customers.includes(editedInvoice.nama_customer) &&
        editedInvoice.nama_customer !== "Semua";
      const discountRate = isRegisteredCustomer ? 0.1 : 0;
      const discount = subTotal * discountRate;

      const neto = subTotal - discount + (editedInvoice.penyesuaian || 0);
      let kembalian = 0;
      if (editedInvoice.bayar) {
        kembalian = editedInvoice.bayar - neto;
      }

      setEditedInvoice({
        ...editedInvoice,
        sub_total: subTotal,
        diskon: discount,
        neto: neto,
        kembalian: kembalian,
      });
    }

    setProductSearchTerm("");
    setShowProductDropdown(false);
  };

  const handleProductSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setProductSearchTerm(term);

    if (term.trim() === "") {
      setFilteredProducts([]);
      setShowProductDropdown(false);
      return;
    }

    if (!products || products.length === 0) {
      fetchProducts();
      return;
    }

    const filtered = products.filter((product) => {
      if (!product) return false;

      const productName = product.nama || product.nama_produk || "";
      return productName.toLowerCase().includes(term.toLowerCase());
    });

    console.log("Filtered products:", filtered);
    setFilteredProducts(filtered);
    setShowProductDropdown(filtered.length > 0);
  };

  const handlePaymentChange = (value: number) => {
    if (editedInvoice) {
      const kembalian = value - editedInvoice.neto;
      setEditedInvoice({
        ...editedInvoice,
        bayar: value,
        kembalian: kembalian,
      });
    }
  };

  const handlePenyesuaianChange = (value: number) => {
    if (editedInvoice) {
      const neto = editedInvoice.sub_total - editedInvoice.diskon + value;
      const kembalian = editedInvoice.bayar - neto;

      setEditedInvoice({
        ...editedInvoice,
        penyesuaian: value,
        neto: neto,
        kembalian: kembalian,
      });
    }
  };

  const handleSaveEdit = async () => {
    try {
      const subTotal = editedItems.reduce(
        (sum, item) => sum + Number(item.subtotal),
        0
      );
      const discountRate = editedInvoice?.diskon
        ? editedInvoice.diskon / editedInvoice.sub_total
        : 0;
      const discount = subTotal * discountRate;
      const neto = subTotal - discount + (editedInvoice?.penyesuaian || 0);

      if (!editedInvoice) {
        throw new Error("No invoice to update");
      }

      if (editedInvoice.bayar < neto) {
        alert(
          `Pembayaran kurang! Total yang harus dibayar: Rp ${neto.toFixed(
            2
          )}, tetapi yang dibayarkan hanya Rp ${editedInvoice.bayar.toFixed(2)}`
        );
        return; // Hentikan proses jika pembayaran kurang
      }

      const formData = new FormData();
      formData.append("diskon", String(discount || 0));
      formData.append("total_harga", String(subTotal || 0));
      formData.append("penyesuaian", String(editedInvoice?.penyesuaian || 0));
      formData.append("total_bayar", String(neto || 0));
      formData.append("kembalian", String(editedInvoice?.kembalian || 0));

      const userId = session?.user?.id;
      if (!userId) {
        throw new Error("User ID is required");
      }
      formData.append("id_user", String(userId));

      if (editedInvoice.id_pelanggan != null) {
        formData.append("id_pelanggan", String(editedInvoice.id_pelanggan));
      }

      const dateValue = editedInvoice.tanggal_penjualan
        ? typeof editedInvoice.tanggal_penjualan === "string"
          ? editedInvoice.tanggal_penjualan
          : editedInvoice.tanggal_penjualan.toISOString()
        : new Date().toISOString();
      formData.append("tanggal_penjualan", dateValue);

      const selectedProduk = editedItems.map((item) => ({
        id: item.id,
        quantity: item.qty,
      }));
      formData.append("selectedProduk", JSON.stringify(selectedProduk));

      await updatePenjualan(formData, editedInvoice.id);

      const updatedInvoice = {
        ...editedInvoice,
        sub_total: subTotal,
        diskon: discount,
        neto: neto,
        items: editedItems,
      };
      setSelectedInvoice(updatedInvoice);
      setInvoiceItems(editedItems);
      setIsEditMode(false);

      // Refresh the invoice list
      fetchInvoices();
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert(
        `Failed to save changes: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/sales?page=${pagination.currentPage}&limit=${pagination.pageSize}&startDate=${startDate}&endDate=${endDate}&customer=${selectedCustomer}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch invoices");
      }

      const data = await response.json();
      setInvoices(data.sales);
      setCustomers(["Semua", ...data.customers]);
      setPagination((prev) => ({
        ...prev,
        totalItems: data.total,
        totalPages: Math.ceil(data.total / pagination.pageSize),
      }));
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetails = async (invoiceId: number) => {
    try {
      const response = await fetch(`/api/sales/${invoiceId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch invoice details");
      }

      const data = await response.json();
      setInvoiceItems(data.items);
      setSelectedInvoice(
        (prev) =>
          ({
            ...(prev || {}),
            items: data.items,
          } as Invoice)
      );
    } catch (error) {
      console.error("Error fetching invoice details:", error);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [
    pagination.currentPage,
    pagination.pageSize,
    startDate,
    endDate,
    selectedCustomer,
  ]);

  useEffect(() => {
    const today = new Date();

    switch (dateFilterType) {
      case "daily":
        setStartDate(format(today, "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
      case "monthly":
        const firstDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );
        const lastDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        );
        setStartDate(format(firstDayOfMonth, "yyyy-MM-dd"));
        setEndDate(format(lastDayOfMonth, "yyyy-MM-dd"));
        break;
      case "yearly":
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
        const lastDayOfYear = new Date(today.getFullYear(), 11, 31);
        setStartDate(format(firstDayOfYear, "yyyy-MM-dd"));
        setEndDate(format(lastDayOfYear, "yyyy-MM-dd"));
        break;
    }
  }, [dateFilterType]);

  const handlePreviousPage = () => {
    if (pagination.currentPage > 1) {
      setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }));
    }
  };

  const handleNextPage = () => {
    if (pagination.currentPage < pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);
    setPagination((prev) => ({ ...prev, pageSize: newSize, currentPage: 1 }));
  };

  const handleInvoiceSelect = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    fetchInvoiceDetails(invoice.id);
  };

  const handlePrintInvoice = () => {
    if (selectedInvoice) {
      PrintInvoice(selectedInvoice.id);
    }
  };

  const handlePrintNota = () => {
    if (selectedInvoice) {
      NotaPrint(selectedInvoice.id);
    }
  };

  const handleCustomerSelect = (customer: string) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm("");
    setShowCustomerDropdown(false);
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.no_invoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.nama_customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter(
    (customer) =>
      customer === "Semua" ||
      customer.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      const parts = dateString.split("-");
      if (parts.length === 3) {
        return `${parts[0]}-${parts[1]}-${parts[2]}`;
      }
      return dateString;
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString()}`;
  };

  return (
    <div className="flex h-[calc(100vh-62px)] p-4">
      {/* Invoices List Column */}
      <div className="w-1/2 p-4 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <select
              className="border p-2"
              value={pagination.pageSize}
              onChange={handlePageSizeChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
          <div className="flex items-center relative flex-1">
            <input
              type="text"
              placeholder="Cari Invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 border-2 p-2"
            />
            <Search className="absolute left-3 text-gray-400" size={20} />
          </div>
        </div>

        {/* Improved Date Filter */}
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-500" />
            <select
              value={dateFilterType}
              onChange={(e) =>
                setDateFilterType(
                  e.target.value as "daily" | "monthly" | "yearly" | "custom"
                )
              }
              className="border p-2"
            >
              <option value="daily">Hari Ini</option>
              <option value="monthly">Bulan Ini</option>
              <option value="yearly">Tahun Ini</option>
              <option value="custom">Periode Kustom</option>
            </select>

            {dateFilterType === "custom" && (
              <div className="flex items-center gap-2 ">
                <span className="text-gray-500 text-sm">Dari:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border p-2"
                />
                <span className="text-gray-500 text-sm">Sampai:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border p-2"
                />
              </div>
            )}
          </div>
        </div>

        {/* Improved Customer Filter with Dropdown */}
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex items-center gap-2">
            <UserCheck size={20} className="text-gray-500" />
            <div className="relative flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari Pelanggan..."
                  value={customerSearchTerm}
                  onChange={(e) => {
                    setCustomerSearchTerm(e.target.value);
                    setShowInvoiceCustomerDropdown(true);
                  }}
                  onFocus={() => setShowInvoiceCustomerDropdown(true)}
                  className="w-full pl-10 border-2 p-2"
                />
                <Search
                  className="absolute left-3 top-3 text-gray-400"
                  size={20}
                />
              </div>

              {showInvoiceCustomerDropdown && (
                <div className="absolute z-10 w-full bg-white mt-1 border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <div
                        key={customer}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          handleCustomerSelect(customer);
                          setShowInvoiceCustomerDropdown(false);
                        }}
                      >
                        {customer}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-gray-500">No customers found</div>
                  )}
                </div>
              )}
              {showCustomerDropdown && (
                <div className="absolute z-10 w-full bg-white mt-1 border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <div
                        key={customer}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        {customer}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-gray-500">No customers found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white h-full p-4 flex flex-col">
          <div className="overflow-y-auto flex-grow max-h-[calc(100vh-280px)]">
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="p-2 text-left">No</th>
                  <th className="p-2 text-left">No. Invoice</th>
                  <th className="p-2 text-left">Tanggal</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice, index) => (
                    <tr
                      key={invoice.id}
                      className={`border-b cursor-pointer hover:bg-gray-100 ${
                        selectedInvoice?.id === invoice.id ? "bg-blue-50" : ""
                      }`}
                      onClick={() => handleInvoiceSelect(invoice)}
                    >
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{invoice.no_invoice}</td>
                      <td className="p-2">{invoice.tgl_invoice}</td>
                      <td className="p-2 text-right">
                        {invoice.neto.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <button
                className={`mr-2 px-3 py-1 border rounded ${
                  pagination.currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100"
                }`}
                onClick={handlePreviousPage}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </button>
              <span className="mx-2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded">
                  {pagination.currentPage}
                </span>
              </span>
              <button
                className={`px-3 py-1 border rounded ${
                  pagination.currentPage === pagination.totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100"
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

      {/* Invoice Details Column */}
      <div className="w-1/2 p-4">
        <div className="bg-white p-4 rounded-lg h-full flex flex-col">
          {!selectedInvoice ? (
            <div className="text-center text-gray-500 my-auto">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-blue-600 font-semibold mb-2">Petunjuk</h3>
                <ul className="text-left list-disc list-inside space-y-2 text-sm">
                  <li>
                    Pilih invoice di daftar sebelah kiri untuk melihat detail
                  </li>
                  <li>Gunakan filter tanggal untuk menemukan invoice lama</li>
                  <li>
                    Filter berdasarkan pelanggan untuk melihat riwayat pembelian
                  </li>
                  <li>Cetak invoice atau nota sesuai kebutuhan</li>
                </ul>
              </div>
            </div>
          ) : isEditMode ? (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Detil Penjualan
                </h3>
              </div>

              <div className="flex-grow overflow-y-auto">
                <div className="grid grid-cols-2 gap-y-2 mb-4">
                  <div>
                    <p className="text-gray-600">Nama Pelanggan</p>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      className="border p-1 w-full"
                      value={editedInvoice?.nama_customer || ""}
                      onChange={(e) => {
                        handleInvoiceChange("nama_customer", e.target.value);
                        fetchCustomers(e.target.value);
                        setShowDetailCustomerDropdown(true);
                      }}
                      onFocus={() => {
                        setShowDetailCustomerDropdown(true);
                        fetchCustomers(editedInvoice?.nama_customer || "");
                      }}
                      onBlur={() =>
                        setTimeout(
                          () => setShowDetailCustomerDropdown(false),
                          200
                        )
                      }
                    />

                    {showDetailCustomerDropdown && (
                      <div className="absolute z-10 w-full bg-white mt-1 border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {customerSearchResults.length > 0 ? (
                          customerSearchResults.map((customer) => (
                            <div
                              key={customer.id}
                              className="p-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                handleInvoiceChange(
                                  "nama_customer",
                                  customer.name
                                );
                                setShowDetailCustomerDropdown(false);
                              }}
                            >
                              {customer.name}
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-gray-500">
                            No customers found
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-gray-600">No. Invoice</p>
                  </div>
                  <div>
                    <input
                      type="text"
                      className="border p-1 w-full"
                      defaultValue={selectedInvoice.no_invoice}
                      disabled
                    />
                  </div>

                  <div>
                    <p className="text-gray-600">Tanggal</p>
                  </div>
                  <div>
                    <input
                      type="date"
                      className="border p-1 w-full"
                      defaultValue={selectedInvoice.tgl_invoice}
                      onChange={(e) =>
                        handleInvoiceChange("tanggal_penjualan", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex mb-2 relative">
                    <input
                      type="text"
                      placeholder="Cari Barang"
                      className="border p-2 flex-grow"
                      value={productSearchTerm}
                      onChange={handleProductSearch}
                      onFocus={() => {
                        if (productSearchTerm) setShowProductDropdown(true);
                      }}
                    />
                    <button className="bg-blue-500 text-white p-2">
                      <Search size={20} />
                    </button>

                    {showProductDropdown && filteredProducts.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-10 bg-white border shadow-lg max-h-48 overflow-y-auto">
                        {filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleAddProduct(product)}
                          >
                            <div className="flex justify-between">
                              <span>{product.nama}</span>
                              <span className="font-semibold">
                                {formatCurrency(product.harga_jual)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Item list with edit capabilities */}
                  {editedItems.length > 0 ? (
                    editedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center border-b pb-1 mb-1"
                      >
                        <div className="flex flex-col">
                          <p className="text-gray-600">{item.produk_nama}</p>
                          <p className="text-gray-600">{item.harga_jual}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            className="border p-1 w-16"
                            value={item.qty}
                            min="1"
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "qty",
                                Number(e.target.value)
                              )
                            }
                          />
                          <p className="font-medium w-24 text-right">
                            {formatCurrency(item.subtotal)}
                          </p>
                          <button
                            className="text-red-500 px-2"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-2">
                      Tidak ada item
                    </div>
                  )}
                </div>

                {/* Transaction summary with editable fields */}
                <div className="mt-4">
                  <div className="flex justify-between items-center py-1">
                    <p className="text-gray-600">Sub Total</p>
                    <p className="font-medium">
                      {formatCurrency(editedInvoice?.sub_total ?? 0)}
                    </p>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <p className="text-gray-600">
                      Diskon{" "}
                      {customers.includes(editedInvoice?.nama_customer ?? "") &&
                      editedInvoice?.nama_customer !== "Semua"
                        ? "(10%)"
                        : ""}
                    </p>
                    <p className="font-medium">
                      {formatCurrency(editedInvoice?.diskon ?? 0)}
                    </p>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <p className="text-gray-600">Penyesuaian</p>
                    <input
                      type="number"
                      className="border text-right w-32"
                      value={editedInvoice?.penyesuaian || 0}
                      onChange={(e) =>
                        handlePenyesuaianChange(Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <p className="text-gray-600 font-semibold">Total</p>
                    <p className="font-semibold text-purple-700">
                      {formatCurrency(editedInvoice?.neto ?? 0)}
                    </p>
                  </div>
                </div>

                {/* Payment section */}
                <div className="mt-2">
                  <div className="flex justify-between items-center py-1">
                    <p className="text-gray-600 font-semibold">Total Bayar</p>
                    <input
                      type="number"
                      className="border text-right w-32"
                      value={editedInvoice?.bayar}
                      onChange={(e) =>
                        handlePaymentChange(Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <p className="text-gray-600 font-semibold">Kembali</p>
                    <p className="font-semibold">
                      {formatCurrency(editedInvoice?.kembalian ?? 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons for edit mode */}
              <div className="mt-2 pt-4 flex justify-end gap-2 border-t">
                <button
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
                  onClick={handleSaveEdit}
                >
                  Simpan
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Detil Penjualan
                </h3>
              </div>

              {/* New layout for details, styled to match the image */}
              <div className="flex-grow">
                <div className="grid grid-cols-2 gap-y-4 mb-4">
                  <div>
                    <p className="text-gray-600">Nama Pelanggan</p>
                  </div>
                  <div>
                    <p>{selectedInvoice.nama_customer || "-"}</p>
                  </div>

                  <div>
                    <p className="text-gray-600">No. Invoice</p>
                  </div>
                  <div>
                    <p>{selectedInvoice.no_invoice}</p>
                  </div>

                  <div>
                    <p className="text-gray-600">Tanggal</p>
                  </div>
                  <div>
                    <p>{formatDate(selectedInvoice.tgl_invoice)}</p>
                  </div>
                </div>

                {/* Item details - Dynamically rendered from invoiceItems */}
                <div className="mb-4">
                  {invoiceItems.length > 0 ? (
                    invoiceItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center border-b pb-1 mb-1"
                      >
                        <div className="flex flex-col">
                          <p className="text-gray-600">{item.produk_nama}</p>
                          <p className="font-medium  w-28">
                            {formatCurrency(item.harga_jual)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <p className="text-gray-600">{item.qty}x</p>
                          <p className=" font-medium">
                            {formatCurrency(item.harga_jual * item.qty)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-2">
                      Tidak ada item
                    </div>
                  )}
                </div>

                {/* Transaction summary */}
                <div className="mt-6">
                  <div className="flex justify-between items-center py-1">
                    <p className="text-gray-600">Sub Total</p>
                    <p className="font-medium">
                      {formatCurrency(selectedInvoice.sub_total)}
                    </p>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <p className="text-gray-600">Diskon</p>
                    <p className="font-medium">
                      {formatCurrency(selectedInvoice.diskon)}
                    </p>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <p className="text-gray-600">Penyesuaian</p>
                    <p className="font-medium">
                      {formatCurrency(selectedInvoice.penyesuaian)}
                    </p>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b text-purple-700">
                    <p className=" font-semibold">Total</p>
                    <p className="font-semibold ">
                      {formatCurrency(selectedInvoice.neto)}
                    </p>
                  </div>
                  <div className="flex justify-between items-center py-1 text-green-700">
                    <p className=" font-semibold">Bayar</p>
                    <p className="font-semibold ">
                      {formatCurrency(selectedInvoice.bayar)}
                    </p>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b">
                    <p className="text-gray-600 font-semibold">Kembalian</p>
                    <p className="font-semibold ">
                      {formatCurrency(selectedInvoice.kembalian)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons at the bottom */}
              <div className="mt-auto pt-4 flex justify-end gap-2">
                <button
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded flex items-center"
                  onClick={handleEditClick}
                >
                  <Edit size={16} className="mr-1" /> Edit
                </button>
                <button
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center"
                  onClick={handlePrintNota}
                >
                  <FileText size={16} className="mr-1" /> Nota
                </button>
                <button
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded flex items-center"
                  onClick={handlePrintInvoice}
                >
                  <FileText size={16} className="mr-1" /> Invoice
                </button>
                <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center">
                  <Mail size={16} className="mr-1" /> PDF
                </button>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center">
                  <Mail size={16} className="mr-1" /> Email
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showCustomerDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowCustomerDropdown(false)}
        />
      )}
      {(showInvoiceCustomerDropdown ||
        showDetailCustomerDropdown ||
        showProductDropdown) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setShowInvoiceCustomerDropdown(false);
            setShowDetailCustomerDropdown(false);
            setShowProductDropdown(false);
          }}
        />
      )}
    </div>
  );
}
