import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Norden Zelt | Alquiler de Carpas Exclusivas",
  description: "Alquiler de carpas para eventos de hasta 300 personas. Brindamos servicio de armado, ambientación, técnica y sonido.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
