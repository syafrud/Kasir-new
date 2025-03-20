import { Decimal } from "@prisma/client/runtime/library";
import toast from "react-hot-toast";

interface DetailPenjualan {
  produk: {
    nama_produk: string;
    harga_jual: number | Decimal;
  };
  harga_jual: number | Decimal;
  diskon: number | Decimal;
  qty: number;
  total_harga: number | Decimal;
  event_produk?: {
    event: {
      nama_event: string;
    };
    diskon: number | Decimal;
  } | null;
}

interface Penjualan {
  id: number;
  tanggal_penjualan: string;
  users: {
    nama_user: string;
  };
  pelanggan?: {
    nama: string;
  };
  detail_penjualan: DetailPenjualan[];
  total_harga: number | Decimal;
  diskon: number | Decimal;
  penyesuaian: number | Decimal;
  total_bayar: number | Decimal;
  kembalian: number | Decimal;
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
      toast.error("Please allow popups for this website");
      return;
    }

    const formatCurrency = (value: number | Decimal | string) => {
      const numValue =
        typeof value === "string" ? parseFloat(value) : Number(value);
      return numValue.toLocaleString("id-ID");
    };

    penjualan.detail_penjualan = penjualan.detail_penjualan.map((item) => {
      const originalPrice = Number(item.produk.harga_jual);
      let priceAfterEventDiscount = originalPrice;

      if (item.event_produk && item.event_produk.diskon) {
        const eventDiscountAmount =
          originalPrice * (Number(item.event_produk.diskon) / 100);
        priceAfterEventDiscount = originalPrice - eventDiscountAmount;
      }

      item.harga_jual = priceAfterEventDiscount;

      const totalBeforeItemDiscount = priceAfterEventDiscount * item.qty;

      const totalAfterAllDiscounts =
        totalBeforeItemDiscount - Number(item.diskon) * item.qty;

      item.total_harga = totalAfterAllDiscounts;

      return item;
    });

    const totalItemDiscount = penjualan.detail_penjualan.reduce((sum, item) => {
      return sum + Number(item.diskon) * item.qty;
    }, 0);

    const subTotal = penjualan.detail_penjualan.reduce((sum, item) => {
      return sum + Number(item.total_harga);
    }, 0);

    const totalSetelahDiskon =
      subTotal - Number(penjualan.diskon) + Number(penjualan.penyesuaian);

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
              <div class="bg-white min-w-[225px] max-w-[225px] h-full flex items-center px-3 gap-3 mx-auto">
                <img
                  src="/logo.png"
                  alt="IndoKasir Logo"
                  width="500"
                  height="300"
                  class="w-full"
                />
              </div>
              <p class="font-bold">PT KasirPintar</p>
              <p>KasirPintar Office</p>
              <p>Telp/WA 089506867404</p>
            </div>

            <div class="border-b border-dashed border-gray-400 pb-2">
              <div class="flex justify-between">
                <span>Tanggal</span>
                <span>: ${new Date(
                  penjualan.tanggal_penjualan
                ).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })} ${new Date(penjualan.tanggal_penjualan).toLocaleTimeString(
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
                <span>No. Nota</span>
                <span>: ${penjualan.id}</span>
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
        <span>${
          detail.event_produk?.event?.nama_event
            ? `<span class="text-sm text-gray-600">
                Harga asli: Rp ${formatCurrency(detail.produk.harga_jual)}
               </span>`
            : ""
        }</span>
      </div>
      ${
        detail.event_produk?.event?.nama_event
          ? `<div class="flex justify-between text-sm text-gray-600">
              <span>${detail.event_produk.event.nama_event} 
                    (Diskon ${Number(detail.event_produk.diskon)}%)
              </span>
              <span>-Rp ${formatCurrency(
                Number(detail.produk.harga_jual) *
                  (Number(detail.event_produk.diskon) / 100) *
                  detail.qty
              )}</span>
            </div>`
          : ""
      }
      <div class="flex justify-between">
        <span>Rp ${formatCurrency(detail.harga_jual)} x ${detail.qty}</span>
        <span>Rp ${formatCurrency(
          Number(detail.harga_jual) * detail.qty
        )}</span>
      </div>
      ${
        Number(detail.diskon) > 0
          ? `<div class="flex justify-between text-sm text-gray-600">
              <div>
                <span>Diskon per item</span>
                <span>Rp -${formatCurrency(
                  Number(detail.diskon)
                )} x ${formatCurrency(Number(detail.qty))}
                </span>
              </div>
              <span>-Rp ${formatCurrency(
                Number(detail.diskon) * detail.qty
              )}</span>
            </div>`
          : ""
      }
      <div class="flex justify-between font-semibold">
        <span>Total</span>
        <span>Rp ${formatCurrency(detail.total_harga)}</span>
      </div>
    </div>
  `
    )
    .join("")}
</div>

            <div class="py-2">
              <div class="flex justify-between">
                <span>Sub Total</span>
                <span>Rp ${formatCurrency(subTotal)}</span>
              </div>
              <div class="flex justify-between">
                <span>Diskon Per Item</span>
                <span>Rp ${formatCurrency(totalItemDiscount)}</span>
              </div>
              <div class="flex justify-between">
                <span>Diskon Member</span>
                <span>Rp ${formatCurrency(penjualan.diskon)}</span>
              </div>
              <div class="flex justify-between">
                <span>Penyesuaian</span>
                <span>Rp ${formatCurrency(penjualan.penyesuaian)}</span>
              </div>
              <div class="flex justify-between font-bold">
                <span>Total</span>
                <span>Rp ${formatCurrency(totalSetelahDiskon)}</span>
              </div>
              <div class="flex justify-between">
                <span>Dibayar</span>
                <span>Rp ${formatCurrency(penjualan.total_bayar)}</span>
              </div>
              <div class="flex justify-between font-bold">
                <span>Kembalian</span>
                <span>Rp ${formatCurrency(penjualan.kembalian)}</span>
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
    toast.error("Error preparing receipt print");
  }
};
