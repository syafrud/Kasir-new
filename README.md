# KasirPintar - Aplikasi Kasir

KasirPintar adalah aplikasi kasir berbasis web yang dirancang untuk mengelola transaksi penjualan berbagai keperluan rumah tangga dan makanan ringan. Aplikasi ini dibangun menggunakan **Next.js (Pages Router)** dengan **MySQL** sebagai database.

## 🚀 Fitur

- Manajemen produk dan kategori
- Transaksi penjualan dengan dukungan barcode
- Cetak invoice
- Generate laporan penjualan berdasarkan periode
- Sistem autentikasi dengan **NextAuth.js**
- Role-based access control (**Admin & Officer**)
- UI modern menggunakan **Tailwind CSS**

## 🛠 Teknologi yang Digunakan

- **Next.js 15 (Pages Router)**
- **TypeScript**
- **Prisma ORM**
- **MySQL**
- **NextAuth.js**
- **Tailwind CSS**
- **React Hook Form**

## 📦 Instalasi

### 1️⃣ Clone Repository

```sh
git clone https://github.com/syafrud/kasir-new.git
cd kasir-new
```

### 2️⃣ Install Dependencies

```sh
npm install
```

### 3️⃣ Konfigurasi Database

- Setup MySQL dan buat database baru.
- Buat file .env di root proyek dan tambahkan konfigurasi berikut:

```sh
DATABASE_URL="mysql://user:password@localhost:3306/kasir"
NEXTAUTH_SECRET="your-secret-key"
```

- Jalankan Prisma untuk migrasi database:

```sh
npx prisma migrate dev --name init
```

### 4️⃣ Menjalankan Projek

```sh
npm run dev
```

### 📝 Lisensi

Proyek ini menggunakan lisensi MIT.

### 📌 Repository

Source code tersedia di github saya [https://github.com/syafrud/kasir-new]
