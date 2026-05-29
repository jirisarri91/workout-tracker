import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/layout/BottomNav';
import { ToastProvider } from '@/components/ui/Toast';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'Workout Tracker',
  description: 'Track and plan your workouts with AI coaching',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f97316',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen bg-slate-50">
        <ToastProvider>
          <main className="max-w-lg mx-auto px-4 pt-4 pb-24">
            {children}
          </main>
          <BottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}
