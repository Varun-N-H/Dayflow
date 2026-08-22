import type { Metadata } from 'next';
import { LoadingProvider } from '@/components/layout/TopProgressBar';
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
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <meta name="darkreader-lock" content="darkreader-lock" />
        <meta name="color-scheme" content="light" />
      </head>
      <body 
        className="bg-slate-50 text-slate-900 min-h-screen antialiased selection:bg-purple-500 selection:text-white"
        suppressHydrationWarning
      >
        <LoadingProvider>
          {children}
        </LoadingProvider>
      </body>
    </html>
  );
}
