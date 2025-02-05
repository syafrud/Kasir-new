import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/auth.config";
import { redirect } from "next/navigation";
import { User } from "../user";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  return (
    <main>
      <h1>Dashboard</h1>
      <h2>Server Session</h2>
      <pre>{JSON.stringify(session)}</pre>
      <h2>Client Call</h2>
      <User />
    </main>
  );
}
