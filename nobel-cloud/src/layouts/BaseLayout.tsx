import Footer from '@/components/Footer';
import Header from '@/components/Header';
import TwSizeIndicator from '@/components/TwSizeIndicator';
import Sidebar, { type SidebarLink } from '@/components/ui/sidebar';
import { type ReactNode } from 'react';
import { HomeIcon, UserIcon, RouteIcon } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';

interface LayoutProps {
  children: ReactNode;
  hasHeader?: boolean;
  hasFooter?: boolean;
  hasPadding?: boolean;
  hasSidebar?: boolean;
}

const menuItems: SidebarLink[] = [
  { url: '/', icon: HomeIcon, text: 'Dashboard' },
  { url: '/patients', icon: UserIcon, text: 'Patients' },
  { url: '/active-journeys', icon: RouteIcon, text: 'Journeys' },
];

export default function BaseLayout({
  children,
  hasHeader = true,
  hasFooter = true,
  hasPadding = true,
  hasSidebar = true,
}: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <TwSizeIndicator />
      {hasHeader && <Header />}
      <main className="flex flex-1">
        {hasSidebar && <Sidebar links={menuItems} />}
        <div
          className={`${hasPadding ? 'flex-1 p-8 max-md:ml-10  overflow-x-hidden' : 'flex-1  overflow-x-hidden'}`}
        >
          {children}
        </div>
      </main>
      <Toaster />
      {hasFooter && <Footer />}
    </div>
  );
}
