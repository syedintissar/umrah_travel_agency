'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, LogIn, LogOut, Menu } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/layout/theme';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ADMIN_NAV, CUSTOMER_NAV, filterNavByPermissions, type PortalNavGroup } from '@/config/site';
import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface PortalUser {
  name: string;
  email: string;
  /** Shown under the name, e.g. "Booking Manager". */
  roleLabel?: string;
}

interface PortalShellProps {
  variant: 'customer' | 'admin';
  /** Staff permission keys. `null` skips filtering (customer portal). */
  permissions?: readonly string[] | null;
  user: PortalUser | null;
  unreadNotifications?: number;
  children: React.ReactNode;
}

function NavList({ groups, onNavigate }: { groups: PortalNavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const rootHrefs = new Set(['/account', '/admin']);
  const active = (href: string) =>
    rootHrefs.has(href) ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label="Primary" className="flex flex-col gap-5 px-3 py-4">
      {groups.map((g, i) => (
        <div key={g.label ?? i}>
          {g.label && (
            <p className="mb-1.5 px-3 text-[0.68rem] font-semibold tracking-[0.14em] text-sidebar-muted uppercase">{g.label}</p>
          )}
          <ul className="space-y-0.5">
            {g.items.map(({ label, href, icon: Icon }) => {
              const isActive = active(href);
              const link = (
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors',
                    'hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none',
                    isActive && 'bg-sidebar-accent text-sidebar-foreground',
                  )}
                >
                  {isActive && <span className="absolute inset-y-1.5 start-0 w-1 rounded-full bg-gold" aria-hidden />}
                  <Icon className={cn('size-[1.1rem] shrink-0', isActive ? 'text-gold' : 'text-sidebar-muted group-hover:text-sidebar-foreground')} aria-hidden />
                  {label}
                </Link>
              );
              return <li key={href}>{link}</li>;
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarBrand({ variant }: { variant: 'customer' | 'admin' }) {
  return (
    <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-5">
      <Logo tone="inverse" href={variant === 'admin' ? '/admin' : '/account'} />
    </div>
  );
}

function UserMenu({ user, variant }: { user: PortalUser | null; variant: 'customer' | 'admin' }) {
  if (!user) {
    return (
      <Button asChild size="sm">
        <Link href="/login"><LogIn /> Sign in</Link>
      </Button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full p-1 pe-2 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:pe-3">
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">{initials(user.name)}</AvatarFallback>
        </Avatar>
        <span className="hidden text-start sm:block">
          <span className="block text-sm leading-tight font-medium">{user.name}</span>
          {user.roleLabel && <span className="block text-xs leading-tight text-muted-foreground">{user.roleLabel}</span>}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium">{user.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={variant === 'admin' ? '/admin/security' : '/account/profile'}>{variant === 'admin' ? 'Security & 2FA' : 'My profile'}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action="/auth/logout" method="post">
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full"><LogOut /> Sign out</button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PortalShell({ variant, permissions = null, user, unreadNotifications = 0, children }: PortalShellProps) {
  // Nav (with icon components) lives in this client module: icons can't be passed from server components.
  const visible = React.useMemo(
    () => filterNavByPermissions(variant === 'admin' ? ADMIN_NAV : CUSTOMER_NAV, permissions),
    [variant, permissions],
  );
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  React.useEffect(() => setOpen(false), [pathname]);

  const bellHref = variant === 'admin' ? '/admin/notifications' : '/account/notifications';

  return (
    <div className="min-h-dvh bg-muted/40">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col overflow-y-auto bg-sidebar text-sidebar-foreground lg:flex">
        <SidebarBrand variant={variant} />
        <div className="flex-1"><NavList groups={visible} /></div>
        {variant === 'customer' && (
          <div className="m-3 rounded-xl bg-sidebar-accent p-4 bg-pattern">
            <p className="font-display text-base font-semibold">Planning another trip?</p>
            <p className="mt-1 text-xs text-sidebar-muted">Browse our latest Umrah packages.</p>
            <Button asChild variant="gold" size="sm" className="mt-3 w-full"><Link href="/packages">Explore packages</Link></Button>
          </div>
        )}
      </aside>

      <div className="lg:ps-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-md sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation"><Menu /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 gap-0 overflow-y-auto border-sidebar-border bg-sidebar p-0 text-sidebar-foreground [&>button]:text-sidebar-foreground">
              <SheetHeader className="p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SidebarBrand variant={variant} />
              </SheetHeader>
              <SheetClose asChild><span className="sr-only">Close</span></SheetClose>
              <NavList groups={visible} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="lg:hidden"><Logo href={variant === 'admin' ? '/admin' : '/account'} className="[&_span:last-child]:hidden sm:[&_span:last-child]:inline" /></div>
          {variant === 'admin' && (
            <Badge variant="outline" className="hidden border-gold/60 text-[0.65rem] tracking-wider text-gold-foreground uppercase sm:inline-flex dark:text-gold">Staff portal</Badge>
          )}
          <div className="flex-1" />

          <Button asChild variant="ghost" size="icon" className="relative" aria-label={unreadNotifications ? `${unreadNotifications} unread notifications` : 'Notifications'}>
            <Link href={bellHref}>
              <Bell />
              {unreadNotifications > 0 && (
                <span className="absolute end-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-gold px-1 text-[0.6rem] leading-4 font-bold text-gold-foreground">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Link>
          </Button>
          <ThemeToggle className="relative" />
          <UserMenu user={user} variant={variant} />
        </header>

        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl p-4 focus:outline-none sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
