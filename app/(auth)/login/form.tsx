"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        username,
        password,
        callbackUrl,
      });

      if (!res?.error) {
        toast.success("Login berhasil");
        router.push("/");
      } else {
        toast.error("Username atau password tidak valid");
      }
    } catch (err: any) {
      toast.error("Terjadi kesalahan saat login");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="w-full sm:min-w-[400px] grid grid-cols-2 gap-4"
    >
      <div className="grid col-span-2 w-full min-w-sm items-center gap-1.5">
        <label className="block text-base font-medium text-gray-700">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 p-2 border block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 md:text-base"
          disabled={isLoading}
        />
      </div>

      <div className="grid col-span-2 w-full min-w-sm items-center gap-1.5">
        <label className="block text-base font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 p-2 border block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 md:text-base"
          disabled={isLoading}
        />
      </div>

      <div className="grid col-span-2 w-full min-w-sm items-center gap-1.5">
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
          disabled={isLoading}
        >
          {isLoading ? "Memproses..." : "Login"}
        </button>
      </div>
    </form>
  );
};
