import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MenuIcon,
  XIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type ComponentType } from 'react';
import { twMerge } from 'tailwind-merge';
import { Link } from 'react-router-dom';

export interface SidebarLink {
  icon: ComponentType;
  text: string;
  url: string;
}

interface Props {
  links: SidebarLink[];
}

function Sidebar({ links }: Props) {
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    const savedState = localStorage.getItem('sidebar-expanded');
    return savedState !== null ? JSON.parse(savedState) : false;
  });
  const [activeLink, setActiveLink] = useState<string>('');

  useEffect(() => {
    setActiveLink(window.location.pathname);
  }, []);

  const toggleSidebar = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('sidebar-expanded', JSON.stringify(newState));
  };

  return (
    <div className="left-0 z-10 w-auto py-4 duration-300 bg-white border-r-2 max-md:h-full md:relative transition-width max-lg:absolute">
      <div className="flex items-center justify-between px-2 transition-all duration-300 w-fit">
        <button
          onClick={toggleSidebar}
          className="px-2 text-gray-600 focus:outline-none max-md:hidden"
        >
          <TooltipProvider delayDuration={50}>
            <Tooltip>
              <TooltipTrigger asChild>
                {isExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </TooltipTrigger>
              {!isExpanded && (
                <TooltipContent className="max-md:hidden" side="right">
                  Expand Sidebar
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </button>
        <button
          onClick={toggleSidebar}
          className="px-2 text-gray-600 focus:outline-none md:hidden"
        >
          {isExpanded ? <XIcon /> : <MenuIcon />}
        </button>
      </div>
      <nav className="flex flex-col items-start mt-4 space-y-2">
        {links.map((item, index) => {
          const IconComponent = item.icon;
          const isActive =
            item.url === '/'
              ? item.url === activeLink
              : activeLink.includes(item.url);
          return (
            <div key={index} className="flex items-center w-full px-2">
              <TooltipProvider delayDuration={50}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.url}
                      onClick={() => setActiveLink(item.url)}
                      className={twMerge(
                        'flex items-center w-full p-2 text-gray-700 rounded hover:bg-gray-200 focus:outline-none',
                        isActive &&
                          'bg-black text-white hover:bg-black hover:text-white'
                      )}
                      aria-label={item.text}
                    >
                      <div>
                        <IconComponent />
                      </div>
                      {isExpanded && (
                        <span
                          className={`ml-4 ${isActive ? 'text-white' : 'text-gray-800'}`}
                        >
                          {item.text}
                        </span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  {!isExpanded && (
                    <TooltipContent className="max-md:hidden" side="right">
                      <span>{item.text}</span>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

export default Sidebar;
