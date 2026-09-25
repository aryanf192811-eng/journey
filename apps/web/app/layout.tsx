import './globals.css';
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';

export const metadata: Metadata = {
  title: 'Journey Intelligence',
  description: 'Find the journey that works, not just the train.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body className="bg-slate-50 text-slate-900 min-h-screen font-sans">{children}</body>
    </html>
  );
}
