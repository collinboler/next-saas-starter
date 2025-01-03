import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { UserProvider } from '@/lib/auth';
import { getUser } from '@/lib/db/queries';
import { Analytics } from "@vercel/analytics/react"
import { ThemeProvider } from 'next-themes';

const manrope = Manrope({ subsets: ['latin'] });

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="viralgo-theme"
    >
      {children}
    </ThemeProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`min-h-[100dvh] ${manrope.className}`}>
        <Providers>
          <UserProvider userPromise={getUser() as Promise<any>}>
            {children}
          </UserProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
