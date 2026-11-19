"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logoutUsuario } from "@/services/auth";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutUsuario();
    } catch {
      // Aunque falle la red, redirigimos al login
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="text-sm font-semibold text-red-600 hover:text-red-800 border border-red-200 rounded px-3 py-1 hover:bg-red-50 transition disabled:opacity-50"
    >
      {isLoggingOut ? "Saliendo..." : "Salir"}
    </button>
  );
}
