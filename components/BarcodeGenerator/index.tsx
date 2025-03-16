// src/components/BarcodeGenerator.tsx
"use client";
import React, { useState } from "react";
import { Search } from "lucide-react";

interface BarcodeSettings {
  paperSize: string;
  width: number;
  height: number;
  showNumbers: boolean;
  barcodeHeight: number;
  barcodeWidth: number;
  marginLeftFirst: number;
  marginLeftNext: number;
  marginTop: number;
  barcodeValue: string;
}

const BarcodeGenerator: React.FC = () => {
  const [settings, setSettings] = useState<BarcodeSettings>({
    paperSize: "A4",
    width: 210,
    height: 297,
    showNumbers: true,
    barcodeHeight: 100,
    barcodeWidth: 2,
    marginLeftFirst: 50,
    marginLeftNext: 50,
    marginTop: 50,
    barcodeValue: "13 Digit Barcode",
  });

  const handleInputChange = (
    field: keyof BarcodeSettings,
    value: string | number | boolean
  ) => {
    setSettings({
      ...settings,
      [field]: value,
    });
  };

  const handleSliderChange = (field: keyof BarcodeSettings, value: number) => {
    setSettings({
      ...settings,
      [field]: value,
    });
  };

  const renderSlider = (
    field: keyof BarcodeSettings,
    value: number,
    label: string
  ) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className="font-medium text-gray-700">{label}</label>
        <span className="text-sm">{value}</span>
      </div>
      <div className="flex items-center">
        <input
          type="range"
          min={1}
          max={field === "barcodeHeight" ? 200 : 100}
          value={value}
          onChange={(e) => handleSliderChange(field, parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Hanya untuk print (tombol print di klik)
      </p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-xl font-bold mb-6 text-gray-800">Cetak Barcode</h1>

      <div className="mb-6">
        <label className="block mb-2 font-medium text-gray-700">
          Ukuran Kertas
        </label>
        <div className="flex items-center gap-2">
          <select
            className="bg-white border border-gray-300 rounded-md p-2 w-28"
            value={settings.paperSize}
            onChange={(e) => handleInputChange("paperSize", e.target.value)}
          >
            <option value="A4">A4</option>
            <option value="A5">A5</option>
            <option value="Letter">Letter</option>
          </select>

          <span className="px-2">W</span>
          <input
            type="number"
            className="border border-gray-300 rounded-md p-2 w-32 text-center"
            value={settings.width}
            onChange={(e) =>
              handleInputChange("width", parseInt(e.target.value))
            }
          />
          <span className="text-gray-500">mm</span>

          <span className="px-2">X</span>
          <span className="px-2">H</span>
          <input
            type="number"
            className="border border-gray-300 rounded-md p-2 w-32 text-center"
            value={settings.height}
            onChange={(e) =>
              handleInputChange("height", parseInt(e.target.value))
            }
          />
          <span className="text-gray-500">mm</span>
        </div>
      </div>

      <div className="mb-6">
        <label className="block mb-2 font-medium text-gray-700">
          Tampilkan Angka
        </label>
        <div className="relative">
          <select
            className="bg-white border border-gray-300 rounded-md p-2 w-full appearance-none"
            value={settings.showNumbers ? "Ya" : "Tidak"}
            onChange={(e) =>
              handleInputChange("showNumbers", e.target.value === "Ya")
            }
          >
            <option value="Ya">Ya</option>
            <option value="Tidak">Tidak</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </div>
        </div>
      </div>

      {renderSlider("barcodeHeight", settings.barcodeHeight, "Tinggi Barcode")}
      {renderSlider("barcodeWidth", settings.barcodeWidth, "Lebar Barcode")}
      {renderSlider(
        "marginLeftFirst",
        settings.marginLeftFirst,
        "Margin Kiri Barcode (kolom pertama)"
      )}
      {renderSlider(
        "marginLeftNext",
        settings.marginLeftNext,
        "Margin Kiri Barcode (kolom berikutnya)"
      )}
      {renderSlider("marginTop", settings.marginTop, "Margin Atas Barcode")}

      <div className="mb-6">
        <label className="block mb-2 font-medium text-gray-700">Produk</label>
        <div className="relative">
          <input
            type="text"
            className="border border-gray-300 rounded-md p-2 pl-3 pr-10 w-full"
            placeholder="13 Digit Barcode"
            value={settings.barcodeValue}
            onChange={(e) => handleInputChange("barcodeValue", e.target.value)}
          />
          <button className="absolute inset-y-0 right-0 flex items-center px-3 bg-white rounded-r-md border-l border-gray-300">
            <Search className="w-5 h-5 text-gray-500" />
            <span className="ml-1 text-xs font-medium">CARI BARANG</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-md px-6 py-2">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            ></path>
          </svg>
          PRINT
        </button>
        <button className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-md px-6 py-2">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            ></path>
          </svg>
          PDF
        </button>
        <button className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-md px-6 py-2">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            ></path>
          </svg>
          WORD
        </button>
      </div>

      <div className="border border-gray-300 p-4 h-64 flex items-center justify-center">
        <p className="text-gray-500">PREVIEW</p>
      </div>
    </div>
  );
};

export default BarcodeGenerator;
