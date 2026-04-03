interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between
        border-b border-zinc-200 bg-white/80 px-4 sm:px-6 backdrop-blur-sm
        dark:border-zinc-800 dark:bg-zinc-950/80"
    >
      <div className="flex min-w-0 items-center gap-2">
        <MobileNavButton />
        <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
      </div>
    </header>
  );
}

import { Menu } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { useUiStore } from '~/store/ui-store';

function MobileNavButton() {
  const openMobileNav = useUiStore((s) => s.openMobileNav);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="md:hidden h-9 w-9"
      aria-label="Open navigation menu"
      onClick={openMobileNav}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
