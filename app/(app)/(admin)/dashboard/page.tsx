"use client";

import React, { useEffect, useState, useRef } from "react";
import Chart from "chart.js/auto";
import {
  ShoppingBag,
  CreditCard,
  DollarSign,
  ChevronDown,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import {
  getStats,
  getTopProducts,
  getCategoryData,
  getNewestItems,
  getTopCustomers,
  getRecentSales,
  StatsData,
  TopProductData,
  CategoryData,
  NewestItemData,
  TopCustomerData,
  RecentSaleData,
  getAvailableYears,
} from "@/app/api/dashboard/action";
import { getGrowthStats, GrowthStats } from "@/app/api/dashboard/action";

export default function Dashboard() {
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [statsYear, setStatsYear] = useState<number>(2025);
  const [topProductsYear, setTopProductsYear] = useState<number>(2025);
  const [categoryYear, setCategoryYear] = useState<number>(2025);
  const [categoryTableYear, setCategoryTableYear] = useState<number>(2025);
  const [customerYear, setCustomerYear] = useState<number>(2025);
  const [salesYear, setSalesYear] = useState<number>(2025);
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [newestItems, setNewestItems] = useState<NewestItemData[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomerData[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSaleData[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTopProducts, setLoadingTopProducts] = useState(true);
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [loadingCategoryTable, setLoadingCategoryTable] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingSales, setLoadingSales] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [salesSearchTerm, setSalesSearchTerm] = useState("");
  const [growthStats, setGrowthStats] = useState<GrowthStats | null>(null);
  const [topProductsDropdownOpen, setTopProductsDropdownOpen] =
    useState<boolean>(false);

  const [categoryTableDropdownOpen, setCategoryTableDropdownOpen] =
    useState<boolean>(false);
  const [customerDropdownOpen, setCustomerDropdownOpen] =
    useState<boolean>(false);
  const [salesDropdownOpen, setSalesDropdownOpen] = useState<boolean>(false);
  const [categoryChartData, setCategoryChartData] = useState<CategoryData[]>(
    []
  );
  const [loadingCategoryChart, setLoadingCategoryChart] = useState(true);
  const loadCategoryChartData = async (year: number) => {
    setLoadingCategoryChart(true);
    try {
      const categories = await getCategoryData(year);
      setCategoryChartData(categories);
    } catch (error) {
      console.error("Failed to load category chart data:", error);
    } finally {
      setLoadingCategoryChart(false);
    }
  };
  const topProductsChartRef = useRef<HTMLCanvasElement | null>(null);
  const topProductsChartInstance = useRef<Chart | null>(null);
  const categoryChartRef = useRef<HTMLCanvasElement | null>(null);
  const categoryChartInstance = useRef<Chart | null>(null);

  const loadAvailableYears = async () => {
    try {
      const years = await getAvailableYears();
      setAvailableYears(years);

      if (years.length > 0) {
        const currentYear = years[0];
        setStatsYear(currentYear);
        setTopProductsYear(currentYear);
        setCategoryYear(currentYear);
        setCategoryTableYear(currentYear);
        setCustomerYear(currentYear);
        setSalesYear(currentYear);
      }
    } catch (error) {
      console.error("Failed to load available years:", error);
    }
  };

  useEffect(() => {
    if (categoryYear && availableYears.length > 0) {
      loadCategoryChartData(categoryYear);
    }
  }, [categoryYear, availableYears]);
  useEffect(() => {
    async function initialize() {
      await loadAvailableYears();
      if (availableYears.length > 0) {
        const currentYear = availableYears[0];
        await Promise.all([
          loadStatsData(currentYear),
          loadTopProductsData(currentYear),
          loadCategoryChartData(currentYear),
          loadCategoryTableData(currentYear),
          loadTopCustomersData(currentYear),
          loadRecentSalesData(currentYear),
          loadNewestItemsData(),
        ]);
      }
    }
    initialize();
  }, []);

  const colorMapping = [
    "bg-red-500",
    "bg-blue-300",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-indigo-500",
  ];

  const loadStatsData = async (year: number) => {
    setLoadingStats(true);
    try {
      const [stats, growth] = await Promise.all([
        getStats(year),
        getGrowthStats(year),
      ]);
      setStatsData(stats);
      setGrowthStats(growth);
    } catch (error) {
      console.error("Failed to load stats data:", error);
    } finally {
      setLoadingStats(false);
    }
  };
  const updateTopProductsChart = (products: TopProductData[]) => {
    if (!topProductsChartRef.current || products.length === 0) return;

    const ctx = topProductsChartRef.current.getContext("2d");
    if (!ctx) return;

    if (topProductsChartInstance.current) {
      topProductsChartInstance.current.destroy();
    }

    const chartData = {
      labels: products.slice(0, 5).map((product) => product.nama_produk),
      datasets: [
        {
          data: products.slice(0, 5).map((product) => product.kontribusi),
          backgroundColor: [
            "#ef4444",
            "#93c5fd",
            "#22c55e",
            "#eab308",
            "#8b5cf6",
          ],
          borderWidth: 0,
        },
      ],
    };

    topProductsChartInstance.current = new Chart(ctx, {
      type: "pie",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.label}: ${context.raw}%`;
              },
            },
          },
        },
      },
    });
  };

  const updateCategoryChart = (categories: CategoryData[]) => {
    if (!categoryChartRef.current || categories.length === 0) return;

    const ctx = categoryChartRef.current.getContext("2d");
    if (!ctx) return;

    if (categoryChartInstance.current) {
      categoryChartInstance.current.destroy();
    }

    const chartData = {
      labels: categories.slice(0, 5).map((category) => category.name),
      datasets: [
        {
          data: categories.slice(0, 5).map((category) => category.value),
          backgroundColor: [
            "#ef4444",
            "#93c5fd",
            "#22c55e",
            "#eab308",
            "#8b5cf6",
          ],
          borderWidth: 0,
        },
      ],
    };

    categoryChartInstance.current = new Chart(ctx, {
      type: "doughnut",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "50%",
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.label}: ${formatCurrency(
                  context.raw as number
                )}`;
              },
            },
          },
        },
      },
    });
  };
  const loadTopProductsData = async (year: number) => {
    setLoadingTopProducts(true);
    try {
      const products = await getTopProducts(year);
      setTopProducts(products);

      updateTopProductsChart(products);
    } catch (error) {
      console.error("Failed to load top products data:", error);
    } finally {
      setLoadingTopProducts(false);
    }
  };

  const loadCategoryData = async (year: number) => {
    setLoadingCategory(true);
    try {
      const categories = await getCategoryData(year);
      setCategoryData(categories);
    } catch (error) {
      console.error("Failed to load category data:", error);
    } finally {
      setLoadingCategory(false);
    }
  };

  const loadCategoryTableData = async (year: number) => {
    setLoadingCategoryTable(true);
    try {
      const categories = await getCategoryData(year);
      setCategoryData(categories);

      updateCategoryChart(categories);
    } catch (error) {
      console.error("Failed to load category table data:", error);
    } finally {
      setLoadingCategoryTable(false);
    }
  };

  const loadTopCustomersData = async (year: number) => {
    setLoadingCustomers(true);
    try {
      const customers = await getTopCustomers(year);
      setTopCustomers(customers);
    } catch (error) {
      console.error("Failed to load top customers data:", error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadRecentSalesData = async (year: number) => {
    setLoadingSales(true);
    try {
      const sales = await getRecentSales(year);
      setRecentSales(sales);
    } catch (error) {
      console.error("Failed to load recent sales data:", error);
    } finally {
      setLoadingSales(false);
    }
  };

  const loadNewestItemsData = async () => {
    try {
      const items = await getNewestItems();
      setNewestItems(items);
    } catch (error) {
      console.error("Failed to load newest items data:", error);
    }
  };

  useEffect(() => {
    if (statsYear && availableYears.length > 0) loadStatsData(statsYear);
  }, [statsYear, availableYears]);

  useEffect(() => {
    if (topProductsYear && availableYears.length > 0)
      loadTopProductsData(topProductsYear);
  }, [topProductsYear, availableYears]);

  useEffect(() => {
    if (categoryYear && availableYears.length > 0)
      loadCategoryData(categoryYear);
  }, [categoryYear, availableYears]);

  useEffect(() => {
    if (categoryTableYear && availableYears.length > 0)
      loadCategoryTableData(categoryTableYear);
  }, [categoryTableYear, availableYears]);

  useEffect(() => {
    if (customerYear && availableYears.length > 0)
      loadTopCustomersData(customerYear);
  }, [customerYear, availableYears]);

  useEffect(() => {
    if (salesYear && availableYears.length > 0) loadRecentSalesData(salesYear);
  }, [salesYear, availableYears]);

  useEffect(() => {
    loadNewestItemsData();
  }, []);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("id-ID");
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toISOString().split("T")[0];
  };

  const filteredProducts =
    searchTerm.trim() === ""
      ? topProducts
      : topProducts.filter((product) =>
          product.nama_produk.toLowerCase().includes(searchTerm.toLowerCase())
        );

  const filteredSales =
    salesSearchTerm.trim() === ""
      ? recentSales
      : recentSales.filter((sale) =>
          (sale.nama_pembeli || "")
            .toLowerCase()
            .includes(salesSearchTerm.toLowerCase())
        );

  const [productsPage, setProductsPage] = useState(1);
  const [salesPage, setSalesPage] = useState(1);
  const productsItemsPerPage = topProducts.length;
  const salesItemsPerPage = 5;

  const paginatedProducts = filteredProducts;
  const totalProductPages = 1;

  const paginatedSales = filteredSales.slice(
    (salesPage - 1) * salesItemsPerPage,
    salesPage * salesItemsPerPage
  );
  const totalSalesPages = Math.ceil(filteredSales.length / salesItemsPerPage);

  useEffect(() => {
    if (
      topProductsChartRef.current &&
      topProducts.length > 0 &&
      !loadingTopProducts
    ) {
      updateTopProductsChart(topProducts);
    }
  }, [topProducts, loadingTopProducts, topProductsYear]);

  useEffect(() => {
    if (
      categoryChartRef.current &&
      categoryData.length > 0 &&
      !loadingCategoryTable
    ) {
      updateCategoryChart(categoryData);
    }
  }, [categoryData, loadingCategoryTable, categoryTableYear]);

  return (
    <div className="">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Total Items Sold */}
        <div className="bg-green-500 text-white rounded-lg p-4 shadow-md">
          <div className="flex justify-between">
            <div>
              <h2 className="text-3xl font-bold">
                {statsData?.totalItemsSold || 0}
              </h2>
              <p className="text-sm">Total Item Terjual</p>
            </div>
            <div className="bg-green-400 rounded-full p-2">
              <ShoppingBag size={24} />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center">
              {growthStats?.itemsSoldGrowth &&
              growthStats.itemsSoldGrowth >= 0 ? (
                <ArrowUp size={16} className="mr-1 text-green-300" />
              ) : (
                <ArrowDown size={16} className="mr-1" />
              )}
              <span>{growthStats?.itemsSoldGrowth || 0}%</span>
            </div>
            <div>
              <span>{statsYear}</span>
            </div>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-blue-400 text-white rounded-lg p-4 shadow-md">
          <div className="flex justify-between">
            <div>
              <h2 className="text-3xl font-bold">
                {statsData?.totalTransactions || 0}
              </h2>
              <p className="text-sm">Total Transaksi</p>
            </div>
            <div className="bg-blue-300 rounded-full p-2">
              <CreditCard size={24} />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center">
              {growthStats?.transactionsGrowth &&
              growthStats.transactionsGrowth >= 0 ? (
                <ArrowUp size={16} className="mr-1 text-green-300" />
              ) : (
                <ArrowDown size={16} className="mr-1" />
              )}
              <span>{growthStats?.transactionsGrowth || 0}%</span>
            </div>
            <div>
              <span>{statsYear}</span>
            </div>
          </div>
        </div>

        {/* Total Income */}
        <div className="bg-red-500 text-white rounded-lg p-4 shadow-md">
          <div className="flex justify-between">
            <div>
              <h2 className="text-3xl font-bold">
                {formatCurrency(statsData?.totalIncome || 0)}
              </h2>
              <p className="text-sm">Total Income</p>
            </div>
            <div className="bg-red-400 rounded-full p-2">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center">
              {growthStats?.incomeGrowth && growthStats.incomeGrowth >= 0 ? (
                <ArrowUp size={16} className="mr-1 text-green-300" />
              ) : (
                <ArrowDown size={16} className="mr-1" />
              )}
              <span>{growthStats?.incomeGrowth || 0}%</span>
            </div>
            <div>
              <span>{statsYear}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Product Sales Table */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-md p-4  border-t-4 border-[#007bff] border-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold ">
                Penjualan Barang Terbesar
              </h2>

              <div className="relative">
                <div
                  className="flex items-center border rounded px-2 py-1 cursor-pointer"
                  onClick={() =>
                    setTopProductsDropdownOpen(!topProductsDropdownOpen)
                  }
                >
                  <span>{topProductsYear}</span>
                  <ChevronDown size={16} className="ml-1" />
                </div>

                {topProductsDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-24 bg-white border rounded shadow-md z-10">
                    {availableYears.map((year) => (
                      <div
                        key={year}
                        className="py-1 px-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setTopProductsYear(year);
                          setTopProductsDropdownOpen(false);
                        }}
                      >
                        {year}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {loadingTopProducts ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm">Loading data...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-4 text-left">No</th>
                      <th className="py-2 px-4 text-left">Nama Barang</th>
                      <th className="py-2 px-4 text-left">Harga Satuan</th>
                      <th className="py-2 px-4 text-left">Jumlah</th>
                      <th className="py-2 px-4 text-left">Total</th>
                      <th className="py-2 px-4 text-left">Kontribusi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.length > 0 ? (
                      paginatedProducts.map((product, index) => (
                        <tr
                          key={product.id}
                          className={index % 2 === 0 ? "bg-gray-100" : ""}
                        >
                          <td className="py-2 px-4">
                            {(productsPage - 1) * productsItemsPerPage +
                              index +
                              1}
                          </td>
                          <td className="py-2 px-4">{product.nama_produk}</td>
                          <td className="py-2 px-4">
                            {formatCurrency(product.harga_jual)}
                          </td>
                          <td className="py-2 px-4">{product.qty}</td>
                          <td className="py-2 px-4">
                            {formatCurrency(product.total)}
                          </td>
                          <td className="py-2 px-4">{product.kontribusi}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-4 px-4 text-center">
                          No products found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pie Chart */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-4  border-t-4 border-[#007bff] border-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Paling Banyak Terjual</h2>
            </div>

            <div className="flex justify-center">
              <div className="w-48 h-48 relative">
                {loadingTopProducts ? (
                  <div className="w-full h-48 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : topProducts.length > 0 ? (
                  <canvas
                    ref={topProductsChartRef}
                    width="200"
                    height="200"
                  ></canvas>
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No data</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center mt-4 space-y-2">
              {topProducts.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center">
                  <div
                    className={`w-4 h-4 mr-2 ${
                      colorMapping[index % colorMapping.length]
                    }`}
                  ></div>
                  <span>{product.nama_produk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 xl:grid-cols-3 gap-6 mb-6">
          {/* Kategori Terlaris */}
          <div className="bg-white rounded-lg shadow-md p-4  border-t-4 border-[#007bff] border-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Kategori Terlaris</h2>
              <div className="relative">
                <div
                  className="flex items-center border rounded px-2 py-1 cursor-pointer"
                  onClick={() =>
                    setCategoryTableDropdownOpen(!categoryTableDropdownOpen)
                  }
                >
                  <span>{categoryTableYear}</span>
                  <ChevronDown size={16} className="ml-1" />
                </div>

                {categoryTableDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-24 bg-white border rounded shadow-md z-10">
                    {availableYears.map((year) => (
                      <div
                        key={year}
                        className="py-1 px-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setCategoryTableYear(year);
                          setCategoryTableDropdownOpen(false);
                        }}
                      >
                        {year}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-48 h-48 relative">
                {loadingCategoryTable ? (
                  <div className="w-full h-48 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : categoryData.length > 0 ? (
                  <canvas
                    ref={categoryChartRef}
                    width="200"
                    height="200"
                  ></canvas>
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No data</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center mt-4 space-y-2">
              {categoryData.map((category, index) => (
                <div key={category.name} className="flex items-center">
                  <div
                    className={`w-4 h-4 mr-2 ${
                      colorMapping[index % colorMapping.length]
                    }`}
                  ></div>
                  <span>{category.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Penjualan Terbesar */}
          <div className="bg-white rounded-lg shadow-md p-4  border-t-4 border-[#007bff] border-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Penjualan Terbesar</h2>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4 text-left">Nama Kategori</th>
                  <th className="py-2 px-4 text-right">Nilai</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.length > 0 ? (
                  categoryData.map((category, index) => (
                    <tr
                      key={category.name}
                      className={index % 2 === 0 ? "bg-gray-100" : ""}
                    >
                      <td className="py-2 px-4">
                        <div className="flex items-center">
                          <div
                            className={`w-5 h-5 ${
                              colorMapping[index % colorMapping.length]
                            } mr-2`}
                          ></div>
                          <span>{category.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-right">
                        {formatCurrency(category.value)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-4 px-4 text-center">
                      No data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Item Terbaru */}
          <div className="bg-white rounded-lg shadow-md p-4 xl:col-span-1 border-t-4 border-[#007bff] border-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Item Terbaru</h2>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4 text-left">Nama Barang</th>
                  <th className="py-2 px-4 text-center">Harga</th>
                  <th className="py-2 px-4 text-center">Dibuat</th>
                </tr>
              </thead>
              <tbody>
                {newestItems.length > 0 ? (
                  newestItems.map((item, index) => (
                    <tr
                      key={item.id}
                      className={index % 2 === 0 ? "bg-gray-100 " : ""}
                    >
                      <td className="py-2 px-4 ">{item.nama_produk}</td>
                      <td className="py-2 px-4 text-center">
                        <span className="bg-blue-500 text-white px-2 py-1 rounded-md">
                          {formatCurrency(item.harga_jual)}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-center">
                        {item.createdAt}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-4 px-4 text-center">
                      No new items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pelanggan Terbesar */}
        <div className="bg-white rounded-lg shadow-md p-4  border-t-4 border-[#007bff] border-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Pelanggan Terbesar</h2>
            <div className="relative">
              <div
                className="flex items-center border rounded px-2 py-1 cursor-pointer"
                onClick={() => setCustomerDropdownOpen(!customerDropdownOpen)}
              >
                <span>{customerYear}</span>
                <ChevronDown size={16} className="ml-1" />
              </div>

              {customerDropdownOpen && (
                <div className="absolute right-0 mt-1 w-24 bg-white border rounded shadow-md z-10">
                  {availableYears.map((year) => (
                    <div
                      key={year}
                      className="py-1 px-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setCustomerYear(year);
                        setCustomerDropdownOpen(false);
                      }}
                    >
                      {year}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 text-left">Nama</th>
                <th className="py-2 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.length > 0 ? (
                topCustomers.map((customer, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-gray-100" : ""}
                  >
                    <td className="py-2 px-4">{customer.nama || "Umum"}</td>
                    <td className="py-2 px-4 text-right">
                      {formatCurrency(customer.total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="py-4 px-4 text-center">
                    No customer data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Penjualan Terbaru - Full width on lg screens */}
        <div className="bg-white rounded-lg shadow-md p-4 lg:col-span-2 border-t-4 border-[#007bff] border-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Penjualan Terbaru</h2>
          </div>

          <div className="flex mb-4 flex-row justify-between">
            <div className="">
              <div className="flex items-center">
                <span className="mr-2">Search:</span>
                <input
                  type="text"
                  className="border rounded px-2 py-1"
                  value={salesSearchTerm}
                  onChange={(e) => setSalesSearchTerm(e.target.value)}
                  placeholder="Search by customer name..."
                />
              </div>
            </div>
            <div className="relative">
              {" "}
              {/* Added a relative positioning container */}
              <div
                className="flex items-center border rounded px-2 py-1 cursor-pointer"
                onClick={() => setSalesDropdownOpen(!salesDropdownOpen)}
              >
                <span>{salesYear}</span>
                <ChevronDown size={16} className="ml-1" />
              </div>
              {salesDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-24 bg-white border rounded shadow-md z-10">
                  {availableYears.map((year) => (
                    <div
                      key={year}
                      className="py-1 px-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSalesYear(year);
                        setSalesDropdownOpen(false);
                      }}
                    >
                      {year}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4 text-left">No</th>
                  <th className="py-2 px-4 text-left">Nama Pembeli</th>
                  <th className="py-2 px-4 text-left">Jml. Item</th>
                  <th className="py-2 px-4 text-left">Nilai</th>
                  <th className="py-2 px-4 text-left">Tanggal Transaksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSales.length > 0 ? (
                  paginatedSales.map((sale, index) => (
                    <tr
                      key={sale.id}
                      className={index % 2 === 0 ? "bg-gray-100" : ""}
                    >
                      <td className="py-2 px-4">
                        {(salesPage - 1) * salesItemsPerPage + index + 1}
                      </td>
                      <td className="py-2 px-4">
                        {sale.nama_pembeli || "Umum"}
                      </td>
                      <td className="py-2 px-4">{sale.item_count}</td>
                      <td className="py-2 px-4">
                        {formatCurrency(sale.total_harga)}
                      </td>
                      <td className="py-2 px-4">
                        {formatDate(sale.tanggal_penjualan)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 px-4 text-center">
                      No recent sales found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div>
              <span className="text-sm">
                Showing{" "}
                {filteredSales.length > 0
                  ? (salesPage - 1) * salesItemsPerPage + 1
                  : 0}{" "}
                to{" "}
                {Math.min(salesPage * salesItemsPerPage, filteredSales.length)}{" "}
                of {filteredSales.length} entries
              </span>
            </div>
            <div className="flex">
              <button
                className={`px-3 py-1 border rounded mr-1 ${
                  salesPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() => setSalesPage((prev) => Math.max(prev - 1, 1))}
                disabled={salesPage === 1}
              >
                PREVIOUS
              </button>
              {Array.from({ length: Math.min(totalSalesPages, 3) }, (_, i) => {
                const pageNum = i + Math.max(1, salesPage - 1);
                if (pageNum <= totalSalesPages) {
                  return (
                    <button
                      key={pageNum}
                      className={`px-3 py-1 border ${
                        salesPage === pageNum ? "bg-blue-500 text-white" : ""
                      } rounded mr-1`}
                      onClick={() => setSalesPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              })}
              <button
                className={`px-3 py-1 border rounded ${
                  salesPage === totalSalesPages
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={() =>
                  setSalesPage((prev) => Math.min(prev + 1, totalSalesPages))
                }
                disabled={salesPage === totalSalesPages}
              >
                NEXT
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
