import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dayflow — Human Resource Management System',
  description: 'Every workday, perfectly aligned. Comprehensive HRMS for employees and administrators.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen antialiased selection:bg-purple-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
