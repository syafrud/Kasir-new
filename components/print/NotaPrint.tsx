interface DetailPenjualan {
  produk: {
    nama_produk: string;
  };
  harga_jual: number | string;
  qty: number;
  total_harga: number | string;
}

interface Penjualan {
  tanggal_penjualan: string;
  users: {
    nama_user: string;
  };
  pelanggan?: {
    nama: string;
  };
  detail_penjualan: DetailPenjualan[];
  total_harga: number | string;
  diskon: number | string;
}

export const NotaPrint = async (id: number) => {
  try {
    const res = await fetch(`/api/penjualan/${id}`);
    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }

    const penjualan: Penjualan = await res.json();

    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) {
      alert("Please allow popups for this website");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt #${id}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              .no-print {
                display: none;
              }
            }
            body {
              font-family: Arial, sans-serif;
            }
          </style>
        </head>
        <body class="p-4">
          <!-- Receipt Template -->
          <div class="max-w-sm mx-auto p-4">
            <div class="text-center mb-4">
              <div class="text-2xl font-bold text-purple-500">IndoKasir</div>
              <p class="font-bold">PT Indokasir Demo</p>
              <p>Indokasir Demo Office</p>
              <p>Telp/WA 08134128703</p>
            </div>

            <div class="border-b border-dashed border-gray-400 pb-2">
              <div class="flex justify-between">
                <span>Tanggal</span>
                <span>: ${
                  new Date(penjualan.tanggal_penjualan)
                    .toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                    .split(" ")[0]
                } ${new Date(penjualan.tanggal_penjualan).toLocaleTimeString(
      "id-ID",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }
    )}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Kasir</span>
                <span>: ${penjualan.users.nama_user}</span>
              </div>
              <div class="flex justify-between">
                <span>Plg</span>
                <span>: ${penjualan.pelanggan?.nama || "Umum"}</span>
              </div>
            </div>

            <div class="border-b border-dashed border-gray-400 py-2">
              ${penjualan.detail_penjualan
                .map(
                  (detail: DetailPenjualan) => ` 
                <div class="mb-2">
                  <div>${detail.produk.nama_produk}</div>
                  <div class="flex justify-between">
                    <span>Rp ${parseInt(
                      detail.harga_jual as string
                    ).toLocaleString("id-ID")} x ${detail.qty}</span>
                    <span>Rp ${parseInt(
                      detail.total_harga as string
                    ).toLocaleString("id-ID")}</span>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>

            <div class="py-2">
              <div class="flex justify-between">
                <span>Sub Total</span>
                <span>Rp ${parseInt(
                  penjualan.total_harga as string
                ).toLocaleString("id-ID")}</span>
              </div>
              <div class="flex justify-between">
                <span>Diskon</span>
                <span>Rp ${parseInt(penjualan.diskon as string).toLocaleString(
                  "id-ID"
                )}</span>
              </div>
              <div class="flex justify-between">
                <span>Penyesuaian</span>
                <span>0</span>
              </div>
              <div class="flex justify-between font-bold">
                <span>Neto</span>
                <span>Rp ${parseInt(
                  penjualan.total_harga as string
                ).toLocaleString("id-ID")}</span>
              </div>
              <div class="flex justify-between">
                <span>Dibayar</span>
                <span>Rp ${parseInt("5000").toLocaleString("id-ID")}</span>
              </div>
              <div class="flex justify-between font-bold">
                <span>Kurang</span>
                <span>Rp ${(
                  parseInt(penjualan.total_harga as string) - 5000
                ).toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div class="text-center mt-4 text-sm">
              <p>Terima kasih telah berbelanja di</p>
              <p>tempat kami. Kepuasan Anda</p>
              <p>adalah tujuan kami.</p>
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
    console.error("Error preparing receipt print:", error);
    alert("Error preparing receipt print");
  }
};
