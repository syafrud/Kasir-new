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
  nama_barang: string;
  harga_satuan: number;
  qty_terjual: number;
  neto: number;
  untung: number;
  tgl_penjualan: string;
}

interface DateRange {
  start: Date;
  end: Date;
}

const PerItemSalesReportPDF = ({
  data,
  dateRange,
  summary,
}: {
  data: SalesData[];
  dateRange: DateRange;
  summary: {
    total_penjualan: number;
    total_untung: number;
    total_qty: number;
  };
}) => {
  const styles = StyleSheet.create({
    page: {
      padding: 30,
      fontSize: 10,
      fontFamily: "Helvetica",
    },
    title: {
      fontSize: 16,
      textAlign: "center",
      marginBottom: 10,
      fontWeight: "bold",
    },
    header: {
      textAlign: "center",
      marginBottom: 20,
    },
    table: {
      width: "100%",
      borderStyle: "solid",
      borderWidth: 1,
      borderColor: "#000",
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#000",
    },
    tableHeaderCell: {
      backgroundColor: "#f0f0f0",
      fontWeight: "bold",
      padding: 5,
      textAlign: "center",
    },
    tableCell: {
      padding: 5,
      textAlign: "center",
    },
    summary: {
      marginTop: 20,
      textAlign: "right",
      fontWeight: "bold",
    },
  });

  const startDateStr = format(dateRange.start, "dd-MM-yyyy");
  const endDateStr = format(dateRange.end, "dd-MM-yyyy");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>PT Indokasir Demo</Text>
        <Text style={styles.header}>
          Laporan Penjualan Per Item {"\n"}
          Periode: {startDateStr} s.d. {endDateStr}
        </Text>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeaderCell, { width: "5%" }]}>No</Text>
            <Text style={[styles.tableHeaderCell, { width: "25%" }]}>
              Nama Barang
            </Text>
            <Text style={[styles.tableHeaderCell, { width: "15%" }]}>
              Harga Satuan
            </Text>
            <Text style={[styles.tableHeaderCell, { width: "15%" }]}>
              Qty Terjual
            </Text>
            <Text style={[styles.tableHeaderCell, { width: "15%" }]}>Neto</Text>
            <Text style={[styles.tableHeaderCell, { width: "15%" }]}>
              Untung
            </Text>
            <Text style={[styles.tableHeaderCell, { width: "10%" }]}>
              Tgl. Penjualan
            </Text>
          </View>

          {data.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: "5%" }]}>
                {index + 1}
              </Text>
              <Text style={[styles.tableCell, { width: "25%" }]}>
                {item.nama_barang}
              </Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>
                {item.harga_satuan.toLocaleString()}
              </Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>
                {item.qty_terjual}
              </Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>
                {item.neto.toLocaleString()}
              </Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>
                {item.untung.toLocaleString()}
              </Text>
              <Text style={[styles.tableCell, { width: "10%" }]}>
                {item.tgl_penjualan}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <Text>
            Total Penjualan: {summary.total_penjualan.toLocaleString()}
          </Text>
          <Text>Total Untung: {summary.total_untung.toLocaleString()}</Text>
          <Text>Total Qty Terjual: {summary.total_qty}</Text>
        </View>
      </Page>
    </Document>
  );
};

const PerItemSalesReport = () => {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateOption, setDateOption] = useState<string>("day");
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    start: new Date(),
    end: new Date(),
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [summary, setSummary] = useState({
    total_penjualan: 0,
    total_untung: 0,
    total_qty: 0,
  });

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

      const response = await axios.get("/api/sales/PerItem", {
        params: {
          startDate: format(dateRange.start, "yyyy-MM-dd"),
          endDate: format(dateRange.end, "yyyy-MM-dd"),
          page: currentPage,
          limit: itemsPerPage,
        },
      });

      setSalesData(response.data.sales || []);
      setTotalItems(response.data.total || 0);
      setSummary(
        response.data.summary || {
          total_penjualan: 0,
          total_untung: 0,
          total_qty: 0,
        }
      );
    } catch (error) {
      console.error("Error fetching sales data:", error);
      setSalesData([]);
      setTotalItems(0);
      setSummary({
        total_penjualan: 0,
        total_untung: 0,
        total_qty: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (salesData.length === 0) {
      toast.error("Tidak ada data untuk di-export");
      return;
    }

    const dateRange = getDateRange();

    const excelData = [
      ...salesData,
      {
        nama_barang: "TOTAL",
        harga_satuan: 0,
        qty_terjual: summary.total_qty,
        neto: summary.total_penjualan,
        untung: summary.total_untung,
        tgl_penjualan: "",
      },
    ];

    try {
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const wscols = [
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
      ];
      worksheet["!cols"] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Penjualan Per Item");

      const filename = `Laporan_Penjualan_Per_Item_${format(
        dateRange.start,
        "dd-MM-yyyy"
      )}_${format(dateRange.end, "dd-MM-dd")}.xlsx`;

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const data = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(data, filename);
    } catch (error) {
      console.error("Error saat ekspor Excel:", error);
      toast.error("Gagal membuat file Excel. Coba lagi.");
    }
  };

  useEffect(() => {
    setSalesData([]);
    fetchSalesData();
  }, [dateOption, customDateRange, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Laporan Penjualan Per Item</h1>

      {/* Date and Customer Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
        <div>
          <label className="block mb-1">Tanggal</label>
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
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white rounded-lg border shadow-sm">
          <p className="text-gray-500">Total Penjualan</p>
          <h2 className="text-2xl font-bold">
            {summary.total_penjualan.toLocaleString()}
          </h2>
        </div>

        <div className="p-4 bg-white rounded-lg border shadow-sm">
          <p className="text-gray-500">Total Untung</p>
          <h2 className="text-2xl font-bold">
            {summary.total_untung.toLocaleString()}
          </h2>
        </div>

        <div className="p-4 bg-white rounded-lg border shadow-sm">
          <p className="text-gray-500">Jumlah Penjualan</p>
          <h2 className="text-2xl font-bold">{summary.total_qty}</h2>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <span className="mr-2">Show</span>
          <select
            className="p-2 border rounded"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span className="ml-2">entries</span>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={exportToExcel}
            className={`px-4 py-2 ${
              salesData.length > 0
                ? "bg-green-600 hover:bg-green-700"
                : "bg-green-400 cursor-not-allowed"
            } text-white rounded`}
            disabled={salesData.length === 0}
          >
            XLSX
          </button>

          {salesData.length > 0 ? (
            <PDFDownloadLink
              document={
                <PerItemSalesReportPDF
                  data={salesData}
                  dateRange={getDateRange()}
                  summary={summary}
                />
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
        </div>
      </div>

      {/* Sales Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">No</th>
              <th className="p-2 border">Nama Barang</th>
              <th className="p-2 border">Harga Satuan</th>
              <th className="p-2 border">Qty Terjual</th>
              <th className="p-2 border">Neto</th>
              <th className="p-2 border">Untung (Rugi)</th>
              <th className="p-2 border">Tgl. Penjualan</th>
            </tr>
          </thead>
          <tbody>
            {salesData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-100">
                <td className="p-2 border text-center">{index + 1}</td>
                <td className="p-2 border">{item.nama_barang}</td>
                <td className="p-2 border text-right">
                  {item.harga_satuan.toLocaleString()}
                </td>
                <td className="p-2 border text-center">{item.qty_terjual}</td>
                <td className="p-2 border text-right">
                  {item.neto.toLocaleString()}
                </td>
                <td className="p-2 border text-right">
                  {item.untung.toLocaleString()}
                </td>
                <td className="p-2 border text-center">{item.tgl_penjualan}</td>
              </tr>
            ))}
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

export default PerItemSalesReport;
