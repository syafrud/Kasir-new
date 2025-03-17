"use client";
import React, { useState, useEffect } from "react";
import {
  format,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
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
import toast from "react-hot-toast";

interface SalesData {
  id: number;
  no_invoice: string;
  tgl_invoice: string;
  nama_customer: string;
  sub_total: number;
  diskon: number;
  neto: number;
  untung: number;
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
  totalPenjualan,
  totalUntung,
  totalItems,
}: {
  data: SalesData[];
  dateRange: DateRange;
  totalPenjualan: number;
  totalUntung: number;
  totalItems: number;
}) => {
  const startDateStr = format(dateRange.start, "dd-MM-yyyy");
  const endDateStr = format(dateRange.end, "dd-MM-yyyy");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>PT KasirPintar</Text>
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
                {item.neto}
              </Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>
                {item.untung}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <Text>Total Penjualan: {totalPenjualan.toLocaleString()}</Text>
          <Text>Total Untung: {totalUntung.toLocaleString()}</Text>
          <Text>Jumlah Penjualan: {totalItems}</Text>
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
  const [totalPenjualan, setTotalPenjualan] = useState<number>(0);
  const [totalUntung, setTotalUntung] = useState<number>(0);

  const getDateRange = (): DateRange => {
    const today = new Date();

    switch (dateOption) {
      case "today":
        return {
          start: startOfDay(today),
          end: endOfDay(today),
        };
      case "month":
        return {
          start: startOfMonth(today),
          end: endOfMonth(today),
        };
      case "year":
        return {
          start: startOfYear(today),
          end: endOfYear(today),
        };
      case "custom":
        const start =
          customDateRange.start > today ? today : customDateRange.start;
        const end = customDateRange.end > today ? today : customDateRange.end;

        return {
          start: start > end ? end : start,
          end: end,
        };
      default:
        return {
          start: today,
          end: today,
        };
    }
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

      if (Array.isArray(response.data.sales)) {
        setSalesData(response.data.sales);
      } else {
        setSalesData([]);
      }

      setTotalItems(response.data.total || 0);
      setTotalPenjualan(response.data.totalPenjualan || 0);
      setTotalUntung(response.data.totalUntung || 0);

      if (response.data.customers) {
        setCustomers(["Semua", ...response.data.customers]);
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSalesData([]);
    fetchSalesData();
  }, [dateOption, customDateRange, currentPage, customerFilter]);

  const handleCustomerFilterChange = (value: string) => {
    setCustomerFilter(value);
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    if (salesData.length === 0) {
      toast.error("Tidak ada data untuk di-export");
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
    }));

    excelData.push({
      No: 0,
      "Nama Customer": "TOTAL",
      "No Invoice": "",
      "Tgl. Invoice": "",
      Neto: totalPenjualan,
      Untung: totalUntung,
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
              onChange={(e) => {
                setDateOption(e.target.value);
                setCurrentPage(1);
              }}
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
                  setCustomDateRange((prev) => ({
                    ...prev,
                    start: new Date(e.target.value),
                  }))
                }
              />
              <span>s.d.</span>
              <input
                type="date"
                className="p-2 border rounded"
                value={format(customDateRange.end, "yyyy-MM-dd")}
                max={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) =>
                  setCustomDateRange((prev) => ({
                    ...prev,
                    end: new Date(e.target.value),
                  }))
                }
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
            {totalPenjualan.toLocaleString()}
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg border">
          <div className="text-sm text-gray-500">Total Untung</div>
          <div className="text-xl font-semibold">
            {totalUntung.toLocaleString()}
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg border">
          <div className="text-sm text-gray-500">Jumlah Penjualan</div>
          <div className="text-xl font-semibold">{totalItems}</div>
        </div>
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

        <div className="flex items-center gap-5">
          {salesData.length > 0 ? (
            <PDFDownloadLink
              document={
                <SalesReportPDF
                  data={salesData}
                  dateRange={getDateRange()}
                  totalPenjualan={totalPenjualan}
                  totalUntung={totalUntung}
                  totalItems={totalItems}
                />
              }
              fileName={`Laporan_Penjualan_${format(
                getDateRange().start,
                "dd-MM-yyyy"
              )}_${format(getDateRange().end, "dd-MM-yyyy")}.pdf`}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              {({ loading }) => (loading ? "PDF..." : "PDF")}
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
                  <td className="py-2 px-4 border text-right">{item.neto}</td>
                  <td className="py-2 px-4 border text-right">{item.untung}</td>
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
