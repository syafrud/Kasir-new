export const PrintInvoice = async (id: number) => {
  try {
    const res = await fetch(`/api/penjualan/${id}`);
    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    const penjualan = await res.json();

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
      alert("Please allow popups for this website");
      return;
    }

    // Prepare the print content
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${id}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="p-3">

          
          <!-- Invoice Template -->
          <div class="border border-gray-300 p-3 max-w-4xl mx-auto">
            <div class="flex justify-between items-start">
              <div class="flex items-center">
                <div class="text-purple-500 mr-4">
                  <div class="text-3xl font-bold">IndoKasir</div>
                </div>
                <div>
                  <p class="font-bold">PT Indokasir Demo</p>
                  <p>Indokasir Demo Office</p>
                  <p>Jugo, Kesamben</p>
                  <p>Kabupaten Blitar, Jawa Timur</p>
                </div>
              </div>
              <div class="text-right">
                <div class="mb-2 inline-block bg-red-500 text-white px-4 py-1">
                  KURANG
                </div>
                <div class="border border-black p-1">
                  <div class="text-center">0005/INV/IK/${new Date().getFullYear()}</div>
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
              <table class="w-full border-collapse border border-gray-300 mt-2">
                <thead>
                  <tr>
                    <th class="border border-gray-300 p-2 text-left w-16">No</th>
                    <th class="border border-gray-300 p-2 text-left">Deskripsi</th>
                    <th class="border border-gray-300 p-2 text-center">Kuantitas</th>
                    <th class="border border-gray-300 p-2 text-center">Harga Satuan</th>
                    <th class="border border-gray-300 p-2 text-center">Harga Total</th>
                    <th class="border border-gray-300 p-2 text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${penjualan.detail_penjualan
                    .map(
                      (detail, index) => `
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
                      <td class="border border-gray-300 p-2 text-right">Rp ${parseInt(
                        detail.harga_jual
                      ).toLocaleString("id-ID")}</td>
                      <td class="border border-gray-300 p-2 text-right">Rp ${parseInt(
                        detail.total_harga
                      ).toLocaleString("id-ID")}</td>
                      <td class="border border-gray-300 p-2 text-right">Rp ${parseInt(
                        detail.total_harga
                      ).toLocaleString("id-ID")}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>

              <table class="w-full border-collapse border border-gray-300 mt-4">
                <tbody>                  
                  <tr>
                    <td class="border border-gray-300 p-2 font-bold">Diskon</td>
                    <td class="border border-gray-300 p-2 text-right">Rp ${parseInt(
                      penjualan.diskon
                    ).toLocaleString("id-ID")}</td>
                  </tr>
                  <tr>
                    <td class="border border-gray-300 p-2 font-bold">Subtotal</td>
                    <td class="border border-gray-300 p-2 text-right">Rp ${parseInt(
                      penjualan.total_harga
                    ).toLocaleString("id-ID")}</td>
                  </tr>

                  <tr>
                    <td class="border border-gray-300 p-2 font-bold">Penyesuaian</td>
                    <td class="border border-gray-300 p-2 text-right">0</td>
                  </tr>
                  <tr>
                    <td class="border border-gray-300 p-2 font-bold">Total</td>
                    <td class="border border-gray-300 p-2 text-right">Rp ${parseInt(
                      penjualan.total_harga
                    ).toLocaleString("id-ID")}</td>
                  </tr>
                  <tr>
                    <td class="border border-gray-300 p-2 font-bold">Total Bayar</td>
                    <td class="border border-gray-300 p-2 text-right">Rp ${parseInt(
                      "5000"
                    ).toLocaleString("id-ID")}</td>
                  </tr>
                  <tr>
                    <td class="border border-gray-300 p-2 font-bold">Kurang</td>
                    <td class="border border-gray-300 p-2 text-right">Rp ${(
                      parseInt(penjualan.total_harga) - 5000
                    ).toLocaleString("id-ID")}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mb-6">
              <h2 class="font-bold mb-2">Pembayaran</h2>
              <table class="w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
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
                    <td class="border border-gray-300 p-2 text-right">Rp ${parseInt(
                      "5000"
                    ).toLocaleString("id-ID")}</td>
                  </tr>
                  <tr>
                    <td class="border border-gray-300 p-2 text-left font-bold" colspan="2">Total</td>
                    <td class="border border-gray-300 p-2 text-right">Rp ${parseInt(
                      "5000"
                    ).toLocaleString("id-ID")}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="text-center mt-12 pt-4 border-t border-gray-300">
              <p>Terima kasih telah berbelanja di tempat kami. Kepuasan Anda adalah tujuan kami.</p>
            </div>
          </div>
          
          <script>
            // Wait for all resources to load before printing
            window.onload = function() {
              // Small delay to ensure styles are applied
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
    alert("Error preparing invoice print");
  }
};
