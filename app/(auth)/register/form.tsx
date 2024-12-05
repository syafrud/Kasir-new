/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Alert } from "@/components/ui/alert";
import { signIn } from "next-auth/react";
import { useState } from "react";

export const RegisterForm = () => {
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [namaUser, setNamaUser] = useState("");
  const [username, setUsername] = useState("");
  const [hp, setHp] = useState("");
  const [status, setStatus] = useState("");
  const [alamat, setAlamat] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/user/register", {
        method: "POST",
        body: JSON.stringify({
          password,
          nama_user: namaUser,
          username,
          hp,
          status,
          alamat,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        signIn();
      } else {
        setError((await res.json()).error);
      }
    } catch (error: any) {
      setError(error?.message);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="w-full sm:min-w-[400px] grid grid-cols-2 gap-3"
    >
      <div className="grid col-span-2 w-full min-w-sm items-center gap-1.5">
        <label className="block text-base font-medium text-gray-700">
          Nama User
        </label>
        <input
          id="nama_user"
          name="nama_user"
          type="text"
          required
          value={namaUser}
          onChange={(e) => setNamaUser(e.target.value)}
          className="mt-1 p-2 border block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 md:text-base"
        />
      </div>
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
        />
      </div>

      <div className="grid col-span-1 w-full min-w-sm items-center gap-1.5">
        <label className="block text-base font-medium text-gray-700">
          No. HP
        </label>
        <input
          id="hp"
          name="hp"
          type="text"
          required
          value={hp}
          onChange={(e) => setHp(e.target.value)}
          className="mt-1 p-2 border block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 md:text-base"
        />
      </div>

      <div className="grid col-span-1 w-full min-w-sm items-center gap-1.5">
        <label className="block text-base font-medium text-gray-700">
          Status
        </label>
        <input
          id="status"
          name="status"
          type="text"
          required
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mt-1 p-2 border block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 md:text-base"
        />
      </div>

      <div className="grid col-span-2 w-full min-w-sm items-center gap-1.5">
        <label className="block text-base font-medium text-gray-700">
          Alamat
        </label>
        <textarea
          id="alamat"
          name="alamat"
          required
          value={alamat}
          onChange={(e) => setAlamat(e.target.value)}
          className="mt-1 p-2 border block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 md:text-base"
        />
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="grid col-span-2 w-full min-w-sm items-center gap-1.5">
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Register
        </button>
      </div>
    </form>
  );
};
