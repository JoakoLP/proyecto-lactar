import '../globals.css';

export const metadata = {
    title: 'Iniciar Sesión - LACTAR',
    description: 'Acceso al Sistema de Gestión Integral LACTAR',
};

export default function AuthLayout({ children }) {
    return (
        <html lang="es">
            <body className="bg-gray-100 font-sans antialiased h-screen flex items-center justify-center">
                {children}
            </body>
        </html>
    );
}