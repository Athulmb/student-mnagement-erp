import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/providers/query-provider';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'BMN Academy - Student Management Portal',
  description: 'Enterprise Student Management and Academic Administration Portal for BMN Academy',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
