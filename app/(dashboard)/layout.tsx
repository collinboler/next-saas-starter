'use client';
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs'
// import './globals.css'
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CircleIcon } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Zap } from 'lucide-react';
import { CreditDisplay } from '@/components/CreditDisplay';
import { useUser } from '@clerk/nextjs';


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {/* <SignedOut>
            <SignInButton />
          </SignedOut>
          <SignedIn>
            
          </SignedIn> */}
          <section className="flex flex-col min-h-screen">
       <Header />
       <main className="flex-grow">{children}</main>
    </section>
        </body>
      </html>
    </ClerkProvider>
  )
}

function Header() {
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <header className="sticky top-0 backdrop-blur-sm bg-gray-100/95 dark:bg-gray-800/95 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.5)] z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <CircleIcon className="h-6 w-6 text-orange-500" />
          <span className="ml-2 text-xl font-semibold text-foreground">ViralGo</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link
            href="/viralgo"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          >
            App
          </Link>
          {/* <Link
            href="/pricing"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          >
            Pricing
          </Link> */}
          <ThemeToggle />
          <SignedIn>
            <div className="flex items-center gap-3">
              <CreditDisplay showAsDialog />
              <UserButton>
                <UserButton.UserProfilePage label="Credits" url="credits" labelIcon={<Zap className="h-4 w-4 text-yellow-500" />}>
                  <div className="p-4">
                    <CreditDisplay />
                  </div>
                </UserButton.UserProfilePage>
              </UserButton>
            </div>
          </SignedIn>
          <SignedOut>
            <Button
              asChild
              className="bg-black hover:bg-gray-800 text-white text-sm px-4 py-2 rounded-full"
            >
              <SignInButton mode="modal" />
            </Button>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <p className="text-sm text-gray-400 text-center">
          © {new Date().getFullYear()} ViralGo
        </p>
      </div>
    </footer>
  );
}
// export default function Layout({ children }: { children: React.ReactNode }) {
//   return (
//     <section className="flex flex-col min-h-screen">
//       <Header />
//       <main className="flex-grow">{children}</main>
 
//     </section>
//   );
// }

