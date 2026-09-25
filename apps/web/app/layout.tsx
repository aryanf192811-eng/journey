import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Journey Intelligence',
  description: 'Find the journey that works, not just the train.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900 min-h-screen">{children}</body>
    </html>
  );
}
