import { Decimal } from "@prisma/client/runtime/library";
import toast from "react-hot-toast";

interface Produk {
  nama_produk: string;
}

interface DetailPenjualan {
  produk: Produk;
  qty: number;
  harga_jual: string | number | Decimal;
  total_harga: string | number | Decimal;
}

interface Pelanggan {
  nama: string;
  alamat: string;
}

interface Penjualan {
  id: number;
  pelanggan?: Pelanggan;
  tanggal_penjualan: string;
  users: {
    nama_user: string;
  };
  detail_penjualan: DetailPenjualan[];
  diskon: string | number | Decimal;
  total_harga: string | number | Decimal;
  penyesuaian: string | number | Decimal;
  total_bayar: string | number | Decimal;
  kembalian: string | number | Decimal;
}

export const PrintInvoice = async (id: number) => {
  try {
    const res = await fetch(`/api/penjualan/${id}`);
    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    const penjualan: Penjualan = await res.json();

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
      toast.error("Please allow popups for this website");
      return;
    }

    const formatCurrency = (value: number | Decimal | string) => {
      const numValue =
        typeof value === "string" ? parseFloat(value) : Number(value);
      return numValue.toLocaleString("id-ID");
    };

    const subTotal = penjualan.detail_penjualan.reduce((sum, item) => {
      return sum + Number(item.total_harga);
    }, 0);

    const totalSetelahDiskon =
      subTotal - Number(penjualan.diskon) + Number(penjualan.penyesuaian);

    const invoiceNumber = `${String(id).padStart(4, "0")}/INV/${new Date(
      penjualan.tanggal_penjualan
    ).getFullYear()}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${id}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              .no-print {
                display: none;
              }
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body class="p-3">
          <!-- Invoice Template -->
          <div class="border border-gray-300 p-6 max-w-4xl mx-auto">
            <div class="flex justify-between items-start">
              <div class="flex items-center gap-4">
                <div class="bg-white min-w-[150px] max-w-[150px] h-full flex items-center">
                  <img
                    src="/logo.png"
                    alt="IndoKasir Logo"
                    width="500"
                    height="300"
                    class="w-full"
                  />
                </div>
                <div>
                  <p class="font-bold text-xl">PT KasirPintar</p>
                  <p>KasirPintar Office</p>
                  <p class="max-w-md">Jl. Parangtritis No.KM.11, Dukuh, Sabdodadi, Kec. Bantul, Kabupaten Bantul, Daerah Istimewa Yogyakarta 55715</p>
                </div>
              </div>
              <div class="text-right">
                <div class="border border-black p-2">
                  <div class="text-center font-bold">${invoiceNumber}</div>
                </div>
              </div>
            </div>

            <div class="text-center my-6">
              <h1 class="text-2xl font-bold">INVOICE</h1>
            </div>

            <div class="mb-6">
              <h2 class="font-bold mb-2">Pembeli</h2>
              <div class="grid grid-cols-2 gap-1">
                <div>Nama</div>
                <div>: ${penjualan.pelanggan?.nama || "Umum"}</div>
                <div>Alamat</div>
                <div>: ${penjualan.pelanggan?.alamat || "-"}</div>
              </div>
            </div>

            <div class="mb-6">
              <h2 class="font-bold mb-2">Transaksi</h2>
              <div class="flex justify-between">
                <div>Kasir: ${penjualan.users.nama_user}</div>
                <div class="text-right">
                  ${new Date(penjualan.tanggal_penjualan).toLocaleDateString(
                    "id-ID",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )} 
                  ${new Date(penjualan.tanggal_penjualan).toLocaleTimeString(
                    "id-ID",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false,
                    }
                  )}
                </div>
              </div>
              <table class="w-full border-collapse border border-gray-300 mt-2">
                <thead>
                  <tr class="bg-gray-100">
                    <th class="border border-gray-300 p-2 text-left w-16">No</th>
                    <th class="border border-gray-300 p-2 text-left">Deskripsi</th>
                    <th class="border border-gray-300 p-2 text-center">Kuantitas</th>
                    <th class="border border-gray-300 p-2 text-center">Harga Satuan</th>
                    <th class="border border-gray-300 p-2 text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${penjualan.detail_penjualan
                    .map(
                      (detail: DetailPenjualan, index: number) => `
                    <tr>
                      <td class="border border-gray-300 p-2 text-center">${
                        index + 1
                      }</td>
                      <td class="border border-gray-300 p-2">${
                        detail.produk.nama_produk
                      }</td>
                      <td class="border border-gray-300 p-2 text-center">${
                        detail.qty
                      }</td>
                      <td class="border border-gray-300 p-2 text-right">Rp ${formatCurrency(
                        detail.harga_jual
                      )}</td>
                      <td class="border border-gray-300 p-2 text-right">Rp ${formatCurrency(
                        detail.total_harga
                      )}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>

              <table class="w-full border-collapse border border-gray-300 mt-4">
                <tbody>                 
                  <tr>
                    <td class="border border-gray-300 p-2 font-bold">Subtotal</td>
                    <td class="border border-gray-300 p-2 text-right">Rp ${formatCurrency(
                      subTotal
                    )}</td>
                  </tr>
                  <tr>
                    <td class="border border-gray-300 p-2 font-bold">Diskon</td>
                    <td class="border border-gray-300 p-2 text-right">Rp ${formatCurrency(
                      penjualan.diskon
                    )}</td>
                  </tr>
                  <tr>
                    <td class="border border-gray-300 p-2 font-bold">Penyesuaian</td>
                    <td class="border border-gray-300 p-2 text-right">Rp ${formatCurrency(
                      penjualan.penyesuaian
                    )}</td>
                  </tr>
                  <tr class="bg-gray-100">
                    <td class="border border-gray-300 p-2 font-bold">Total</td>
                    <td class="border border-gray-300 p-2 text-right font-bold">Rp ${formatCurrency(
                      totalSetelahDiskon
                    )}</td>
                  </tr>
                  <tr>
                    <td class="border border-gray-300 p-2 font-bold">Total Bayar</td>
                    <td class="border border-gray-300 p-2 text-right">Rp ${formatCurrency(
                      penjualan.total_bayar
                    )}</td>
                  </tr>
                  <tr>
                    <td class="border border-gray-300 p-2 font-bold">Kembalian</td>
                    <td class="border border-gray-300 p-2 text-right">Rp ${formatCurrency(
                      penjualan.kembalian
                    )}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mb-6">
              <h2 class="font-bold mb-2">Pembayaran</h2>
              <table class="w-full border-collapse border border-gray-300">
                <thead>
                  <tr class="bg-gray-100">
                    <th class="border border-gray-300 p-2 text-left w-16">No</th>
                    <th class="border border-gray-300 p-2 text-left">Tanggal Pembayaran</th>
                    <th class="border border-gray-300 p-2 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="border border-gray-300 p-2 text-center">1</td>
                    <td class="border border-gray-300 p-2">${new Date(
                      penjualan.tanggal_penjualan
                    ).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}</td>
                    <td class="border border-gray-300 p-2 text-right">Rp ${formatCurrency(
                      penjualan.total_bayar
                    )}</td>
                  </tr>
                  <tr class="bg-gray-100">
                    <td class="border border-gray-300 p-2 text-left font-bold" colspan="2">Total</td>
                    <td class="border border-gray-300 p-2 text-right">Rp ${formatCurrency(
                      penjualan.total_bayar
                    )}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="flex justify-between mt-12 pt-4 border-t border-gray-300">
              <div class="w-1/3 text-center">
                <p class="mb-16">Penerima</p>
                <p>___________________</p>
              </div>
              <div class="text-center">
                <p>Terima kasih telah berbelanja di tempat kami.</p>
                <p>Kepuasan Anda adalah tujuan kami.</p>
              </div>
              <div class="w-1/3 text-center">
                <p class="mb-16">Hormat Kami</p>
                <p>___________________</p>
              </div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                setTimeout(() => window.close(), 500);
              }, 300);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  } catch (error) {
    console.error("Error preparing invoice print:", error);
    toast.error("Error preparing invoice print");
  }
};
