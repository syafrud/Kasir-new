import Link from "next/link";
import { LoginForm } from "./form";

export default function LoginPage() {
  return (
    <div className="min-h-screen min-w-screen flex justify-center items-center bg-indigo-100">
      <div className="sm:shadow-xl px-8 py-8 sm:bg-white rounded-xl space-y-6">
        <h1 className="font-semibold text-2xl ">Login</h1>
        <LoginForm />
      </div>
    </div>
  );
}
