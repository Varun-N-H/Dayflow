import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dayflow — Human Resource Management System',
  description: 'Every workday, perfectly aligned. Modern, professional HRMS for employees and administrators.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased selection:bg-purple-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
