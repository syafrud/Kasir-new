// pages/cetak-barcode.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import type { produk } from "@prisma/client";
import JsBarcode from "jsbarcode";
import { jsPDF } from "jspdf";
import toast from "react-hot-toast";

interface BarcodeSettings {
  paperSize: string;
  width: number;
  height: number;
  showNumbers: boolean;
  barcodeHeight: number;
  barcodeWidth: number;
  marginLeft1: number;
  marginLeft2: number;
  marginTop: number;
}

interface ProdukWithDetails extends produk {
  kategori?: {
    nama_kategori: string;
  };
  detail_penjualan?: {
    qty: number;
  }[];
  qty?: number;
}

interface ApiResponse {
  produk: ProdukWithDetails[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

interface PaperSize {
  width: number;
  height: number;
}

const CetakBarcode: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [products, setProducts] = useState<ProdukWithDetails[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProdukWithDetails[]>(
    []
  );
  const [selectedProducts, setSelectedProducts] = useState<ProdukWithDetails[]>(
    []
  );
  const [preview, setPreview] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const paperSizes: Record<string, PaperSize> = {
    A4: { width: 210, height: 297 },
    A3: { width: 297, height: 420 },
    Letter: { width: 216, height: 279 },
    Custom: { width: 210, height: 297 },
  };

  const [settings, setSettings] = useState<BarcodeSettings>({
    paperSize: "A4",
    width: paperSizes.A4.width,
    height: paperSizes.A4.height,
    showNumbers: true,
    barcodeHeight: 100,
    barcodeWidth: 2,
    marginLeft1: 50,
    marginLeft2: 50,
    marginTop: 50,
  });

  const fetchProducts = async (
    search: string = "",
    currentPage: number = 1
  ) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/produk?search=${encodeURIComponent(
          search
        )}&page=${currentPage}&limit=10`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data: ApiResponse = await response.json();
      setProducts(data.produk.map((p) => ({ ...p, qty: 1 })));
      setFilteredProducts(data.produk.map((p) => ({ ...p, qty: 1 })));
      setTotalPages(data.totalPages);
      setPage(data.currentPage);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts(searchTerm, 1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSettingsChange = (key: keyof BarcodeSettings, value: any) => {
    if (key === "showNumbers") {
      setSettings({
        ...settings,
        [key]: value === "Ya",
      });
    } else {
      setSettings({
        ...settings,
        [key]: Number(value),
      });
    }

    if (
      (key === "width" || key === "height") &&
      settings.paperSize !== "Custom"
    ) {
      setSettings((prevSettings) => ({
        ...prevSettings,
        paperSize: "Custom",
      }));
    }
  };

  const selectProduct = (product: ProdukWithDetails) => {
    setSelectedProducts((prev) => {
      const existingIndex = prev.findIndex((p) => p.id === product.id);
      if (existingIndex >= 0) {
        return prev;
      } else {
        return [...prev, { ...product, qty: 1 }];
      }
    });
  };

  const removeProduct = (productId: number) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const updateProductQty = (productId: number, qty: number) => {
    if (qty < 1) qty = 1;
    setSelectedProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, qty } : p))
    );
  };

  const generatePreview = () => {
    if (selectedProducts.length === 0) {
      toast.error("Pilih setidaknya satu produk untuk mencetak barcode");
      return;
    }

    setPreview(true);

    setTimeout(() => {
      if (!previewContainerRef.current) return;

      const container = previewContainerRef.current;
      container.innerHTML = "";

      container.style.width = `${settings.width}mm`;
      container.style.minHeight = `${settings.height}mm`;
      container.style.position = "relative";
      container.style.padding = "10mm";
      container.style.boxSizing = "border-box";
      container.style.display = "grid";
      const columnSize = 127 + (settings.barcodeWidth - 1) * 107;
      container.style.gridTemplateColumns = `repeat(auto-fill, minmax(${columnSize}px, 1fr))`;
      container.style.gap = "5mm";
      container.style.backgroundColor = "white";

      selectedProducts.forEach((product) => {
        for (let i = 0; i < (product.qty || 1); i++) {
          const barcodeItem = document.createElement("div");
          barcodeItem.style.border = "1px solid #ddd";
          barcodeItem.style.borderRadius = "2mm";
          barcodeItem.style.padding = "3mm";
          barcodeItem.style.display = "flex";
          barcodeItem.style.flexDirection = "column";
          barcodeItem.style.alignItems = "center";
          barcodeItem.style.backgroundColor = "white";

          const productName = document.createElement("div");
          productName.style.fontWeight = "bold";
          productName.style.fontSize = "10pt";
          productName.style.textAlign = "center";
          productName.style.marginBottom = "2mm";
          productName.textContent = product.nama_produk;
          barcodeItem.appendChild(productName);

          const productPrice = document.createElement("div");
          productPrice.style.fontSize = "10pt";
          productPrice.style.marginBottom = "3mm";
          productPrice.textContent = `Rp ${product.harga_jual.toLocaleString()}`;
          barcodeItem.appendChild(productPrice);

          const barcodeCanvas = document.createElement("canvas");
          try {
            JsBarcode(barcodeCanvas, product.barcode, {
              format: "CODE128",
              width: settings.barcodeWidth,
              height: settings.barcodeHeight,
              displayValue: settings.showNumbers,
              fontSize: 12,
              margin: 5,
            });
          } catch (e) {
            console.error("Error generating barcode:", e);
            barcodeCanvas.height = 30;
            barcodeCanvas.width = 100;
            const ctx = barcodeCanvas.getContext("2d");
            if (ctx) {
              ctx.fillStyle = "red";
              ctx.font = "10px Arial";
              ctx.fillText("Invalid barcode", 10, 20);
            }
          }

          barcodeItem.appendChild(barcodeCanvas);
          container.appendChild(barcodeItem);
        }
      });
    }, 100);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=800,height=600");

    if (!printWindow) {
      toast.error(
        "Popup blocker may be preventing printing. Please allow popups for this site."
      );
      return;
    }

    printWindow.document.write(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Print Barcode</title>
    <style>
      @page {
        size: ${settings.width}mm ${settings.height}mm;
        margin: 10mm 0 0 0;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
      }
      .page {
        width: 100%; /* Menggunakan 100% agar responsif */
        height: 100%; /* Menggunakan 100% agar responsif */
        box-sizing: border-box;
        padding: 10px; /* Kurangi padding untuk mencegah overflow */
      }
      .product-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(${
          127 + (settings.barcodeWidth - 1) * 107
        }px, 1fr));
        gap:5px;
      }
      .product-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 5px;
        width: ${127 + (settings.barcodeWidth - 1) * 107}px; 
        break-inside: avoid; 
        border: 1px solid #000;
        padding:5zpx; 
        border-radius: 0px; 
      }
      .product-name {
        font-weight: bold;
        font-size: 12pt;
        text-align: center;
      }
      .product-price {
        font-size: 12pt;
        text-align: center;
      }
      .barcode-image {
        margin: 10px 0;
        text-align: center;
      }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
  </head>
  <body>
  <div class="page">
    <div class="product-grid">
  `);

    selectedProducts.forEach((product, index) => {
      for (let i = 0; i < (product.qty || 1); i++) {
        printWindow.document.write(`
      <div class="product-container">
        <div class="product-name">${product.nama_produk}</div>
        <div class="product-price">Rp ${new Intl.NumberFormat("id-ID").format(
          parseFloat(product.harga_jual.toString())
        )}</div>
        <div class="barcode-image">
          <canvas id="barcode-${index}-${i}"></canvas>
        </div>
      </div>
    `);
      }
    });

    printWindow.document.write(`
    </div>
  </div>
    <script>
      window.onload = function() {
        ${selectedProducts
          .map((product, productIndex) => {
            let scriptCode = "";
            for (let i = 0; i < (product.qty || 1); i++) {
              scriptCode += `
                try {
                  JsBarcode("#barcode-${productIndex}-${i}", "${product.barcode}", {
                    format: "CODE128",
                    width: ${settings.barcodeWidth},
                    height: ${settings.barcodeHeight},
                    displayValue: ${settings.showNumbers},
                    fontSize: 12,
                    margin: 5
                  });
                } catch(e) { console.error("Error generating barcode", e); }
              `;
            }
            return scriptCode;
          })
          .join("\n")}
        
        setTimeout(function() {
          window.print();
          setTimeout(function() {
            window.close();
          }, 100);
        }, 500);
      };
    </script>
  </body>
  </html>
  `);

    printWindow.document.close();
  };

  const exportToPDF = () => {
    if (selectedProducts.length === 0) {
      toast.error("Pilih setidaknya satu produk untuk mencetak barcode");
      return;
    }

    const pdf = new jsPDF({
      orientation: settings.width > settings.height ? "landscape" : "portrait",
      unit: "mm",
      format: [settings.width, settings.height],
    });

    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    document.body.appendChild(tempDiv);

    const margin = 10;
    const availableWidth = settings.width - 2 * margin;
    const availableHeight = settings.height - 2 * margin;

    const gapSize = 5;

    const itemWidth = Math.min(50, availableWidth / 3) - gapSize;
    const itemHeight = Math.min(35, availableHeight / 5) - gapSize;

    const columns = Math.floor(availableWidth / (itemWidth + gapSize));
    const rows = Math.floor(availableHeight / (itemHeight + gapSize));

    let currentPage = 1;
    let currentRow = 0;
    let currentCol = 0;

    selectedProducts.forEach((product) => {
      for (let i = 0; i < (product.qty || 1); i++) {
        if (currentRow >= rows) {
          pdf.addPage();
          currentPage++;
          currentRow = 0;
          currentCol = 0;
        }

        const x = margin + currentCol * (itemWidth + gapSize);
        const y = margin + currentRow * (itemHeight + gapSize);

        const barcodeContainer = document.createElement("div");
        barcodeContainer.style.padding = "2mm";

        const productName = document.createElement("div");
        productName.style.fontWeight = "bold";
        productName.style.fontSize = "8pt";
        productName.style.textAlign = "center";
        productName.textContent = product.nama_produk;
        barcodeContainer.appendChild(productName);

        const productPrice = document.createElement("div");
        productPrice.style.fontSize = "8pt";
        productPrice.style.textAlign = "center";
        productPrice.textContent = `Rp ${new Intl.NumberFormat("id-ID").format(
          parseFloat(product.harga_jual.toString())
        )}`;
        barcodeContainer.appendChild(productPrice);

        const barcodeCanvas = document.createElement("canvas");
        JsBarcode(barcodeCanvas, product.barcode, {
          format: "CODE128",
          width: settings.barcodeWidth,
          height: settings.barcodeHeight / 2,
          displayValue: settings.showNumbers,
          fontSize: 8,
          margin: 2,
        });
        barcodeContainer.appendChild(barcodeCanvas);

        tempDiv.appendChild(barcodeContainer);

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.text(product.nama_produk, x + itemWidth / 2, y + 5, {
          align: "center",
        });

        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          `Rp ${new Intl.NumberFormat("id-ID").format(
            parseFloat(product.harga_jual.toString())
          )}`,
          x + itemWidth / 2,
          y + 10,
          { align: "center" }
        );

        pdf.addImage(
          barcodeCanvas.toDataURL("image/jpeg", 1.0),
          "JPEG",
          x + 2,
          y + 12,
          itemWidth - 4,
          itemHeight - 15
        );

        pdf.rect(x, y, itemWidth, itemHeight);

        currentCol++;

        if (currentCol >= columns) {
          currentCol = 0;
          currentRow++;
        }
      }
    });

    document.body.removeChild(tempDiv);

    pdf.save(`barcodes_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchProducts(searchTerm, newPage);
  };

  const handleSearch = () => {
    fetchProducts(searchTerm, 1);
    setIsModalOpen(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className=" max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Cetak Barcode</h1>
      <div className="grid gap-6">
        {/* Paper Size Settings */}
        <div className="flex items-center gap-2">
          <label className="w-40 font-medium">Ukuran Kertas</label>
          <select
            className="border rounded px-3 py-2 w-28"
            value={settings.paperSize}
            onChange={(e) => {
              const selectedSize = e.target.value;
              if (selectedSize in paperSizes) {
                setSettings({
                  ...settings,
                  paperSize: selectedSize,
                  width: paperSizes[selectedSize].width,
                  height: paperSizes[selectedSize].height,
                });
              }
            }}
          >
            <option value="A4">A4</option>
            <option value="A3">A3</option>
            <option value="Letter">Letter</option>
            <option value="Custom">Custom</option>
          </select>

          <span className="mx-2">W</span>
          <input
            type="number"
            className="border rounded px-3 py-2 w-24"
            value={settings.width}
            onChange={(e) => handleSettingsChange("width", e.target.value)}
            disabled={settings.paperSize !== "Custom"}
          />
          <span className="mx-1">mm</span>

          <span className="mx-2">X</span>
          <span className="mx-2">H</span>
          <input
            type="number"
            className="border rounded px-3 py-2 w-24"
            value={settings.height}
            onChange={(e) => handleSettingsChange("height", e.target.value)}
            disabled={settings.paperSize !== "Custom"}
          />
          <span className="mx-1">mm</span>
        </div>

        {/* Show Numbers */}
        <div className="flex items-center gap-2">
          <label className="w-40 font-medium">Tampilkan Angka</label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={settings.showNumbers ? "Ya" : "Tidak"}
            onChange={(e) =>
              handleSettingsChange("showNumbers", e.target.value)
            }
          >
            <option value="Ya">Ya</option>
            <option value="Tidak">Tidak</option>
          </select>
        </div>

        {/* Barcode Height */}
        <div className="flex items-center gap-2">
          <label className="w-40 font-medium">Tinggi Barcode</label>
          <div className="w-full">
            <input
              type="range"
              className="w-full"
              min="20"
              max="200"
              value={settings.barcodeHeight}
              onChange={(e) =>
                handleSettingsChange("barcodeHeight", e.target.value)
              }
            />
            <div className="text-right">{settings.barcodeHeight}</div>
          </div>
        </div>

        {/* Barcode Width */}
        <div className="flex items-center gap-2">
          <label className="w-40 font-medium">Lebar Barcode</label>
          <div className="w-full">
            <input
              type="range"
              className="w-full"
              min="1"
              max="5"
              step="0.1"
              value={settings.barcodeWidth}
              onChange={(e) =>
                handleSettingsChange("barcodeWidth", e.target.value)
              }
            />
            <div className="text-right">{settings.barcodeWidth}</div>
          </div>
        </div>

        <div className="flex gap-2 items-center mt-6 mb-4">
          <input
            type="text"
            placeholder="Cari nama produk atau barcode..."
            className="border rounded px-3 py-2 flex-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Cari Produk
          </button>
        </div>
        {/* Product list table */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Daftar Produk</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-200 p-2 rounded-full"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mb-4 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Cari nama produk atau barcode..."
                  className="border rounded px-3 py-2 flex-1"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button
                  onClick={() => fetchProducts(searchTerm, 1)}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Cari
                </button>
              </div>

              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Barcode</th>
                    <th className="px-4 py-2 text-left">Nama Produk</th>
                    <th className="px-4 py-2 text-left">Kategori</th>
                    <th className="px-4 py-2 text-left">Harga</th>
                    <th className="px-4 py-2 text-left">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-2 text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-2 text-center">
                        Tidak ada produk yang ditemukan
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="border-t hover:bg-gray-50"
                      >
                        <td className="px-4 py-2">{product.barcode}</td>
                        <td className="px-4 py-2">{product.nama_produk}</td>
                        <td className="px-4 py-2">
                          {product.kategori?.nama_kategori || "-"}
                        </td>
                        <td className="px-4 py-2">
                          Rp{" "}
                          {new Intl.NumberFormat("id-ID").format(
                            parseFloat(product.harga_jual.toString())
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => {
                              selectProduct(product);
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Pilih
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination di dalam modal */}
              <div className="mt-4 flex justify-between items-center p-3 border-t">
                <div>
                  Halaman {page} dari {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className={`px-3 py-1 rounded ${
                      page === 1
                        ? "bg-gray-200 text-gray-500"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    Sebelumnya
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className={`px-3 py-1 rounded ${
                      page === totalPages
                        ? "bg-gray-200 text-gray-500"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Selected Products */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Produk Terpilih</h2>
        {selectedProducts.length === 0 ? (
          <div className="border rounded p-4 text-center text-gray-500">
            Belum ada produk yang dipilih
          </div>
        ) : (
          <div className="border rounded">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Barcode</th>
                  <th className="px-4 py-2 text-left">Nama Produk</th>
                  <th className="px-4 py-2 text-left">Harga</th>
                  <th className="px-4 py-2 text-left">Jumlah</th>
                  <th className="px-4 py-2 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {selectedProducts.map((product) => (
                  <tr key={product.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{product.barcode}</td>
                    <td className="px-4 py-2">{product.nama_produk}</td>
                    <td className="px-4 py-2">
                      Rp{" "}
                      {new Intl.NumberFormat("id-ID").format(
                        parseFloat(product.harga_jual.toString())
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          className="bg-gray-200 px-2 py-1 rounded"
                          onClick={() =>
                            updateProductQty(product.id, (product.qty || 1) - 1)
                          }
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          className="border rounded px-2 py-1 w-16 text-center"
                          value={product.qty || 1}
                          onChange={(e) =>
                            updateProductQty(
                              product.id,
                              parseInt(e.target.value) || 1
                            )
                          }
                        />
                        <button
                          className="bg-gray-200 px-2 py-1 rounded"
                          onClick={() =>
                            updateProductQty(product.id, (product.qty || 1) + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeProduct(product.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Action Buttons */}
      <div className="flex gap-4 mt-4">
        <button
          onClick={generatePreview}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"
          disabled={selectedProducts.length === 0}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          Preview
        </button>
        <button
          onClick={handlePrint}
          className="bg-green-600 text-white px-4 py-2 rounded flex items-center"
          disabled={selectedProducts.length === 0}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Print
        </button>
        <button
          onClick={exportToPDF}
          className="bg-orange-600 text-white px-4 py-2 rounded flex items-center"
          disabled={selectedProducts.length === 0}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export PDF
        </button>
      </div>{" "}
      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Preview Barcode</h2>
              <button
                onClick={() => setPreview(false)}
                className="bg-gray-200 p-2 rounded-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">
                  Preview ukuran kertas: {settings.width} x {settings.height}mm
                </p>
                <p className="text-sm text-gray-500">
                  Barcode: {settings.barcodeWidth} x {settings.barcodeHeight}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-green-600 text-white px-4 py-2 rounded flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  Print
                </button>
                <button
                  onClick={exportToPDF}
                  className="bg-orange-600 text-white px-4 py-2 rounded flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  PDF
                </button>
              </div>
            </div>

            <div
              className="mx-auto border shadow bg-white overflow-auto"
              style={{ maxHeight: "70vh" }}
            >
              <div
                id="preview-container"
                ref={previewContainerRef}
                style={{
                  width: `${settings.width}mm`,
                  minHeight: `${settings.height}mm`,
                  backgroundColor: "white",
                  margin: "0 auto",
                }}
              >
                {/* Barcodes will be generated here */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CetakBarcode;
