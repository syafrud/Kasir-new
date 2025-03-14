"use client";

import { Suspense } from "react";
import { LoginForm } from "./form";
import { Toaster } from "react-hot-toast";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen min-w-screen flex justify-center items-center bg-indigo-100">
        <div className="sm:shadow-xl px-8 py-8 sm:bg-white rounded-xl space-y-6">
          <h1 className="font-semibold text-2xl">Login</h1>
          <LoginForm />
        </div>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "",
          duration: 5000,
          removeDelay: 1000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />
    </Suspense>
  );
}
