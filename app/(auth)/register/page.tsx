import Link from "next/link";
import { RegisterForm } from "./form";

export default function RegisterPage() {
  return (
    <div className="min-h-screen min-w-screen flex justify-center items-center bg-indigo-100">
      <div className="sm:shadow-xl px-6 py-6 sm:bg-white rounded-xl space-y-4">
        <h1 className="font-semibold text-2xl ">Register</h1>
        <RegisterForm />
        <p className="text-center">
          Have an account?{" "}
          <Link className="text-indigo-500 hover:underline" href="/login">
            {" "}
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
