import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import "../globals.css";
import Sidebar from "@/components/layout/Sidebar";
import LogoutButton from "@/components/layout/LogoutButton";
import AccesoDenegadoBanner from "@/components/layout/AccesoDenegadoBanner";
import { getVerifiedUserFromSession } from "@/utils/authServer";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/utils/session";

export const metadata = {
  title: "LACTAR - Sistema de Gestión",
  description: "Sistema de Gestión Integral para Fábrica de Quesos - Grupo 21",
};

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    redirect("/login");
  }

  const user = await getVerifiedUserFromSession(session);
  if (!user) {
    redirect("/login");
  }

  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-800 font-sans antialiased h-screen flex overflow-hidden">
        <Sidebar user={user} />

        <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50">
          <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center border-b border-gray-200 z-0">
            <h1 className="text-2xl font-bold text-blue-900">Sistema LACTAR</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 font-medium hidden sm:inline">
                Seminario Integrador - Grupo 21
              </span>
              <LogoutButton />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8 relative">
            <Suspense fallback={null}>
              <AccesoDenegadoBanner />
            </Suspense>
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
