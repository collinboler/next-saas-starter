import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { UserProvider } from '@/lib/auth';
import { getUser } from '@/lib/db/queries';
import { Analytics } from "@vercel/analytics/react"
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ClerkProvider } from '@clerk/nextjs';

const manrope = Manrope({ subsets: ['latin'] });

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="viralgo-theme"
      >
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </ThemeProvider>
    </ClerkProvider>
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
