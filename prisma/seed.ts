import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = await hash("test", 12);
  const user = await prisma.users.upsert({
    where: { username: "test" },
    update: { password },
    create: {
      username: "test",
      nama_user: "Test User",
      password,
      user_priv: "ADMIN",
      alamat: "Some Address",
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
