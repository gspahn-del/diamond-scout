import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { runMigrations } from '@/lib/db/migrate';

// Run migrations on every cold start
runMigrations().catch(console.error);

export const metadata: Metadata = {
  title: 'Diamond Scout',
  description: 'Baseball scouting, pitch tracking, and analytics platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Diamond Scout',
  },
};

export const viewport: Viewport = {
  themeColor: '#1e293b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0f172a] text-[#f8fafc] antialiased">
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <MobileNav />
        </div>
      </body>
    </html>
  );
}
