'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, UserRound } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/layout/theme';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PUBLIC_NAV, type NavLink, type NavMenu } from '@/config/site';
import { cn } from '@/lib/utils';

const isMenu = (item: NavLink | NavMenu): item is NavMenu => 'items' in item;

function useActive() {
  const pathname = usePathname();
  return (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));
}

const linkBase =
  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

export function SiteHeader({ siteName }: { siteName?: string }) {
  const isActive = useActive();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-transparent bg-background/85 backdrop-blur-md transition-[border-color,box-shadow]',
        scrolled && 'border-border shadow-card',
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo name={siteName} />

        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          {PUBLIC_NAV.map((item) =>
            isMenu(item) ? (
              <DropdownMenu key={item.label}>
                <DropdownMenuTrigger
                  className={cn(linkBase, 'inline-flex items-center gap-1 data-[state=open]:bg-accent', item.items.some((i) => isActive(i.href)) && 'text-primary')}
                >
                  {item.label}
                  <ChevronDown className="size-3.5 opacity-60" aria-hidden />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72 p-2">
                  {item.items.map(({ label, href, description, icon: Icon }) => (
                    <DropdownMenuItem key={href} asChild className="items-start gap-3 rounded-lg p-2.5">
                      <Link href={href}>
                        {Icon && (
                          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                            <Icon className="size-4" />
                          </span>
                        )}
                        <span>
                          <span className="block text-sm font-medium">{label}</span>
                          {description && <span className="block text-xs text-muted-foreground">{description}</span>}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={cn(linkBase, isActive(item.href) && 'text-primary')}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle className="relative" />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">
              <UserRound /> Sign in
            </Link>
          </Button>
          <Button asChild variant="gold" size="sm" className="hidden md:inline-flex">
            <Link href="/custom-package">Request a package</Link>
          </Button>
          <MobileMenu siteName={siteName} />
        </div>
      </div>
    </header>
  );
}

function MobileMenu({ siteName }: { siteName?: string }) {
  const isActive = useActive();
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // Close the sheet after navigating.
  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(22rem,100vw)] gap-0 overflow-y-auto p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle asChild>
            <div><Logo href={null} name={siteName} /></div>
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile" className="flex flex-col gap-1 p-3">
          {PUBLIC_NAV.map((item) =>
            isMenu(item) ? (
              <div key={item.label} className="mt-2">
                <p className="px-3 pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">{item.label}</p>
                {item.items.map(({ label, href, icon: Icon }) => (
                  <SheetClose asChild key={href}>
                    <Link href={href} aria-current={isActive(href) ? 'page' : undefined}
                      className={cn(linkBase, 'flex items-center gap-3 py-2.5', isActive(href) && 'bg-accent text-primary')}>
                      {Icon && <Icon className="size-4 text-primary" aria-hidden />}
                      {label}
                    </Link>
                  </SheetClose>
                ))}
              </div>
            ) : (
              <SheetClose asChild key={item.href}>
                <Link href={item.href} aria-current={isActive(item.href) ? 'page' : undefined}
                  className={cn(linkBase, 'py-2.5', isActive(item.href) && 'bg-accent text-primary')}>
                  {item.label}
                </Link>
              </SheetClose>
            ),
          )}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t p-4">
          <Button asChild variant="gold" size="lg"><Link href="/custom-package">Request a custom package</Link></Button>
          <Button asChild variant="outline" size="lg"><Link href="/login"><UserRound /> Sign in</Link></Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
