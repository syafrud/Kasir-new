import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = await hash("admin", 12);
  const user = await prisma.users.upsert({
    where: { username: "admin" },
    update: { password },
    create: {
      username: "admin",
      nama_user: "Admin User",
      password,
      user_priv: "ADMIN",
      alamat:
        "Jalan Parangtritis Km. 11, Dukuh, Sabdodadi, Bantul, Kabupaten Bantul, DI Yogyakarta, Indonesia · (0274) 367156.",
      hp: "1234567890",
      status: "active",
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  console.log({ user });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
