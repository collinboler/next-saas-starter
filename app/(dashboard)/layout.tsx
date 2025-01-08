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
import { CircleIcon, Home, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/lib/auth';
import { signOut } from '@/app/(login)/actions';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <header className="border-b border-border bg-background">
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
          <Link
            href="/pricing"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          >
            Pricing
          </Link>
          <ThemeToggle />
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
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
