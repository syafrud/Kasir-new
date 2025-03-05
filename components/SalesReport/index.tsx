"use client";
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import axios from "axios";

interface SalesData {
  id: number;
  no_invoice: string;
  tgl_invoice: string;
  nama_customer: string;
  sub_total: number;
  diskon: number;
  neto: number;
  untung: number;
  kurang_bayar: number;
  status: string;
}

interface DateRange {
  start: Date;
  end: Date;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  header: {
    fontSize: 12,
    marginBottom: 20,
    textAlign: "center",
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableHeaderCell: {
    backgroundColor: "#f0f0f0",
    padding: 5,
    fontSize: 10,
    fontWeight: "bold",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
  },
  tableCell: {
    padding: 5,
    fontSize: 9,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
  },
  summary: {
    marginTop: 20,
    fontSize: 12,
  },
});

const SalesReportPDF = ({
  data,
  dateRange,
}: {
  data: SalesData[];
  dateRange: DateRange;
}) => {
  const startDateStr = format(dateRange.start, "dd-MM-yyyy");
  const endDateStr = format(dateRange.end, "dd-MM-yyyy");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>PT Indokasir Demo</Text>
        <Text style={styles.header}>
          Laporan Penjualan {"\n"}
          Periode: {startDateStr} s.d. {endDateStr}
        </Text>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeaderCell, { width: "5%" }]}>No</Text>
            <Text style={[styles.tableHeaderCell, { width: "20%" }]}>
              Nama Customer
            </Text>
            <Text style={[styles.tableHeaderCell, { width: "15%" }]}>
              No Invoice
            </Text>
            <Text style={[styles.tableHeaderCell, { width: "15%" }]}>
              Tgl. Invoice
            </Text>
            <Text style={[styles.tableHeaderCell, { width: "15%" }]}>Neto</Text>
            <Text style={[styles.tableHeaderCell, { width: "15%" }]}>
              Untung
            </Text>
            <Text style={[styles.tableHeaderCell, { width: "15%" }]}>
              Kurang Bayar
            </Text>
          </View>

          {data.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: "5%" }]}>
                {index + 1}
              </Text>
              <Text style={[styles.tableCell, { width: "20%" }]}>
                {item.nama_customer || "-"}
              </Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>
                {item.no_invoice}
              </Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>
                {item.tgl_invoice}
              </Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>
                {item.neto.toLocaleString()}
              </Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>
                {item.untung.toLocaleString()}
              </Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>
                {item.kurang_bayar.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <Text>
            Total Penjualan:{" "}
            {data.reduce((sum, item) => sum + item.neto, 0).toLocaleString()}
          </Text>
          <Text>
            Total Untung:{" "}
            {data.reduce((sum, item) => sum + item.untung, 0).toLocaleString()}
          </Text>
          <Text>Jumlah Penjualan: {data.length}</Text>
        </View>
      </Page>
    </Document>
  );
};

const SalesReport = () => {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateOption, setDateOption] = useState<string>("day");
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    start: new Date(),
    end: new Date(),
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [customerFilter, setCustomerFilter] = useState<string>("Semua");
  const [customers, setCustomers] = useState<string[]>([]);

  const getDateRange = (): DateRange => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (dateOption) {
      case "today":
        break;
      case "month":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "year":
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
      case "custom":
        return {
          start: customDateRange.start > today ? today : customDateRange.start,
          end: customDateRange.end > today ? today : customDateRange.end,
        };
      default:
        break;
    }

    return { start, end };
  };

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange();

      const response = await axios.get("/api/sales", {
        params: {
          startDate: format(dateRange.start, "yyyy-MM-dd"),
          endDate: format(dateRange.end, "yyyy-MM-dd"),
          customer: customerFilter !== "Semua" ? customerFilter : undefined,
          page: currentPage,
          limit: itemsPerPage,
        },
      });

      setSalesData(response.data.sales);
      setTotalItems(response.data.total);

      if (response.data.customers) {
        setCustomers(["Semua", ...response.data.customers]);
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [dateOption, customDateRange, currentPage, customerFilter]);

  const handleDateOptionChange = (option: string) => {
    setDateOption(option);
    setCurrentPage(1);
  };

  const handleCustomDateChange = (type: "start" | "end", value: string) => {
    const selectedDate = new Date(value);
    const today = new Date();

    if (selectedDate > today) {
      alert("Cannot select future dates");
      return;
    }

    setCustomDateRange((prev) => ({
      ...prev,
      [type]: selectedDate,
    }));
    setCurrentPage(1);
  };

  const handleCustomerFilterChange = (value: string) => {
    setCustomerFilter(value);
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    if (salesData.length === 0) {
      alert("Tidak ada data untuk di-export");
      return;
    }

    const dateRange = getDateRange();

    const excelData = salesData.map((item, index) => ({
      No: index + 1,
      "Nama Customer": item.nama_customer || "-",
      "No Invoice": item.no_invoice,
      "Tgl. Invoice": item.tgl_invoice,
      Neto: item.neto,
      Untung: item.untung,
      "Kurang Bayar": item.kurang_bayar,
      Status: item.status,
    }));

    excelData.push({
      No: 0,
      "Nama Customer": "TOTAL",
      "No Invoice": "",
      "Tgl. Invoice": "",
      Neto: salesData.reduce((sum, item) => sum + item.neto, 0),
      Untung: salesData.reduce((sum, item) => sum + item.untung, 0),
      "Kurang Bayar": salesData.reduce(
        (sum, item) => sum + item.kurang_bayar,
        0
      ),
      Status: "",
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const wscols = [
      { wch: 5 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
    ];
    worksheet["!cols"] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Penjualan");

    const filename = `Laporan_Penjualan_${format(
      dateRange.start,
      "dd-MM-yyyy"
    )}_${format(dateRange.end, "dd-MM-yyyy")}.xlsx`;
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(data, filename);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Laporan Penjualan</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block mb-1">Tanggal</label>
          <div className="flex items-center">
            <select
              className="w-full p-2 border rounded"
              value={dateOption}
              onChange={(e) => handleDateOptionChange(e.target.value)}
            >
              <option value="today">Hari Ini</option>
              <option value="month">Bulan Ini</option>
              <option value="year">Tahun Ini</option>
              <option value="custom">Pilih Tanggal</option>
            </select>
          </div>

          {dateOption === "custom" && (
            <div className="flex items-center mt-2 space-x-2">
              <input
                type="date"
                className="p-2 border rounded"
                value={format(customDateRange.start, "yyyy-MM-dd")}
                max={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) =>
                  handleCustomDateChange("start", e.target.value)
                }
              />
              <span>s.d.</span>
              <input
                type="date"
                className="p-2 border rounded"
                value={format(customDateRange.end, "yyyy-MM-dd")}
                max={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => handleCustomDateChange("end", e.target.value)}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block mb-1">Nama Pelanggan</label>
          <select
            className="w-full p-2 border rounded"
            value={customerFilter}
            onChange={(e) => handleCustomerFilterChange(e.target.value)}
          >
            {customers.map((customer, index) => (
              <option key={index} value={customer}>
                {customer}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg border">
          <div className="text-sm text-gray-500">Total Penjualan</div>
          <div className="text-xl font-semibold">
            {salesData
              .reduce((sum, item) => sum + item.neto, 0)
              .toLocaleString()}
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg border">
          <div className="text-sm text-gray-500">Total Untung</div>
          <div className="text-xl font-semibold">
            {salesData
              .reduce((sum, item) => sum + item.untung, 0)
              .toLocaleString()}
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg border">
          <div className="text-sm text-gray-500">Jumlah Penjualan</div>
          <div className="text-xl font-semibold">{totalItems}</div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex justify-end space-x-2 mb-4">
        {salesData.length > 0 ? (
          <PDFDownloadLink
            document={
              <SalesReportPDF data={salesData} dateRange={getDateRange()} />
            }
            fileName={`Laporan_Penjualan_${format(
              getDateRange().start,
              "dd-MM-yyyy"
            )}_${format(getDateRange().end, "dd-MM-yyyy")}.pdf`}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            {({ loading }) => (loading ? "Menyiapkan PDF..." : "PDF")}
          </PDFDownloadLink>
        ) : (
          <button
            disabled
            className="px-4 py-2 bg-red-400 text-white rounded cursor-not-allowed"
          >
            PDF
          </button>
        )}

        {salesData.length > 0 ? (
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            XLSX
          </button>
        ) : (
          <button
            disabled
            className="px-4 py-2 bg-green-400 text-white rounded cursor-not-allowed"
          >
            XLSX
          </button>
        )}

        <button
          className={`px-4 py-2 ${
            salesData.length > 0
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-blue-400 cursor-not-allowed"
          } text-white rounded`}
          disabled={salesData.length === 0}
        >
          Email
        </button>
      </div>

      {/* Results per page & search */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <span className="mr-2">Show</span>
          <select className="p-1 border rounded">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span className="ml-2">entries</span>
        </div>

        <div className="flex items-center">
          <span className="mr-2">Search:</span>
          <input type="text" className="p-1 border rounded" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border">No</th>
              <th className="py-2 px-4 border">Nama Customer</th>
              <th className="py-2 px-4 border">No. Invoice</th>
              <th className="py-2 px-4 border">Tgl. Transaksi</th>
              <th className="py-2 px-4 border">Neto</th>
              <th className="py-2 px-4 border">Untung/Rugi</th>
              <th className="py-2 px-4 border">Kurang Bayar</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : salesData.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 text-center">
                  Tidak ada data penjualan
                </td>
              </tr>
            ) : (
              salesData.map((item, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="py-2 px-4 border text-center">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="py-2 px-4 border">
                    {item.nama_customer || "-"}
                  </td>
                  <td className="py-2 px-4 border">{item.no_invoice}</td>
                  <td className="py-2 px-4 border">{item.tgl_invoice}</td>
                  <td className="py-2 px-4 border text-right">
                    {item.neto.toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border text-right">
                    {item.untung.toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border text-right">
                    {item.kurang_bayar.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div>
          Showing to {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
          {totalItems} entries
        </div>

        <div className="flex">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border mr-1 rounded disabled:opacity-50"
          >
            Previous
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={i}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-1 border mx-1 rounded ${
                  currentPage === pageNum ? "bg-blue-500 text-white" : ""
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() =>
              handlePageChange(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 border ml-1 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
