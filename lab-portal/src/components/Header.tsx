import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import LogoBlack from '@/assets/logo-black.svg';
import UserDp from '@/assets/randomuser.jpg';
import { buttonVariants } from './ui/button';
import { BellIcon, ShoppingCartIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { twMerge } from 'tailwind-merge';
import { clearAuthToken } from '@/features/auth/authSlice';
import { type RootState } from '@/app/store';

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isLoggedIn = useSelector(
    (state: RootState) => state.auth.accessToken !== null
  );

  const handleLogout = () => {
    dispatch(clearAuthToken());
    navigate('/login');
  };

  return (
    <header className="z-20 w-full bg-white border-b-2">
      <div className="flex items-center justify-between px-5 py-3 mx-auto">
        <div className="flex items-end gap-4">
          <Link to="/">
            <img src={LogoBlack} alt="Nobel Biocare logo" className="h-6" />
          </Link>
          <span className="relative px-2 py-1 text-xs rounded-lg bg-neutral-300 text-neutral-600 whitespace-nowrap top-1">
            Lab Portal
          </span>
        </div>
        {isLoggedIn ? (
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback>
                    <img src={UserDp} alt="" />
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="mr-4">
                <DropdownMenuLabel>
                  <button onClick={handleLogout} className="w-full text-left">
                    Logout
                  </button>
                </DropdownMenuLabel>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link
              to="/register"
              className={buttonVariants({ variant: 'ghost' })}
            >
              Register
            </Link>
            <Link
              to="/login"
              className={buttonVariants({ variant: 'default' })}
            >
              Login
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
