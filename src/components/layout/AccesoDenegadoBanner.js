"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function AccesoDenegadoBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  if (searchParams.get("acceso") !== "denegado") {
    return null;
  }

  return (
    <div
      role="alert"
      className="mb-6 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl px-4 py-3 flex items-center justify-between gap-4 text-sm"
    >
      <span className="font-medium">
        No tenés permisos para acceder a esa sección con tu rol actual.
      </span>
      <button
        type="button"
        onClick={() => router.replace(pathname)}
        aria-label="Cerrar aviso"
        className="text-amber-800 hover:text-amber-950 font-bold"
      >
        ✕
      </button>
    </div>
  );
}
