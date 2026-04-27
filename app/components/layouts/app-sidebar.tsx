import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  ChevronDown,
  ChevronLeft,
  Plus,
  Settings,
  Zap,
  X,
} from 'lucide-react';
import { cn } from '~/lib/utils';
import { useId, useState } from 'react';
import { UserButton, useUser } from '@clerk/react-router';
import { Button } from '~/components/ui/button';
import { NavLink, useLocation } from 'react-router';
import { Separator } from '~/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '~/components/ui/tooltip';
import { useUiStore } from '~/store/ui-store';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  children?: { label: string; path: string }[];
  type?: 'button' | 'link';
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
    type: 'link',
  },
  {
    label: 'Inventory',
    icon: Package,
    path: '/inventory',
    children: [{ label: 'All Products', path: '/inventory' }],
  },
  {
    label: 'Sales',
    icon: ShoppingCart,
    path: '/sales',
    children: [
      { label: 'Invoices', path: '/sales' },
      { label: 'Quotations', path: '/sales/quotation' },
      { label: 'New Sale', path: '/sales/new' },
    ],
  },
  {
    label: 'Customers',
    icon: Users,
    path: '/customers',
    type: 'link',
  },
  {
    label: 'Settings',
    icon: Settings,
    path: '/settings',
    type: 'link',
  },
];

export function AppSidebar({
  variant = 'desktop',
  onNavigate,
}: {
  variant?: 'desktop' | 'mobile';
  onNavigate?: () => void;
}) {
  const isMobile = variant === 'mobile';
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const setCollapsed = useUiStore((s) => s.setSidebarCollapsed);
  const { user } = useUser();
  const mobileNavTitleId = useId();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    'Sales',
    'Inventory',
  ]);
  const location = useLocation();

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label],
    );
  };

  const isItemActive = (item: NavItem) => {
    if (location.pathname === item.path) return true;
    return item.children?.some((c) => location.pathname === c.path);
  };

  const handleNavigate = () => {
    onNavigate?.();
  };

  // On mobile we always render the expanded sidebar.
  const effectiveCollapsed = isMobile ? false : collapsed;
  const displayName =
    user?.fullName ??
    user?.primaryEmailAddress?.emailAddress ??
    'Signed in user';

  const mobileNavItemClass = isMobile
    ? 'min-h-11 items-center py-2'
    : 'h-9';
  const mobileSubItemClass = isMobile
    ? 'min-h-11 items-center py-2 text-sm pl-10 pr-3'
    : 'h-8 pl-8 pr-2 text-[13px]';
  const mobileNewSaleClass = isMobile
    ? 'min-h-11 justify-center gap-2 py-2.5 text-base font-medium'
    : 'py-2 text-sm';
  const mobileCollapsedCta = isMobile
    ? 'min-h-11 min-w-11 p-0'
    : 'h-9 w-9';

  return (
    <TooltipProvider>
      <span id={mobileNavTitleId} className="sr-only">
        Main navigation
      </span>
      <aside
        aria-labelledby={mobileNavTitleId}
        className={cn(
          isMobile
            ? 'flex h-full min-h-0 w-full min-w-0 max-w-full flex-col border-0 bg-white pt-[env(safe-area-inset-top,0px)] dark:bg-zinc-950'
            : 'fixed left-0 top-0 z-40 flex h-screen flex-col',
          !isMobile && 'border-r border-zinc-200 dark:border-zinc-800',
          !isMobile && (effectiveCollapsed ? 'w-16' : 'w-64'),
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex shrink-0 items-center justify-between',
            isMobile
              ? 'min-h-14 gap-2 px-3 py-2'
              : 'h-14 px-3',
          )}
        >
          {!effectiveCollapsed && (
            <div className="flex min-w-0 items-center gap-2">
              <div
                className={cn(
                  'flex shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white',
                  isMobile ? 'h-10 w-10' : 'h-8 w-8',
                )}
              >
                <Zap className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
              </div>
              <span
                className={cn(
                  'font-semibold tracking-tight text-zinc-900 dark:text-zinc-50',
                  isMobile ? 'truncate text-base' : 'text-sm',
                )}
              >
                ARL Adhesives
              </span>
            </div>
          )}

          {isMobile && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
              onClick={handleNavigate}
              aria-label="Close navigation menu"
            >
              <X className="h-6 w-6" strokeWidth={2} />
            </Button>
          )}

          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-500 hover:text-zinc-900
                dark:text-zinc-400 dark:hover:text-zinc-50"
              onClick={() => setCollapsed(!collapsed)}
            >
              <ChevronLeft
                className={cn(
                  'h-4 w-4 transition-transform',
                  collapsed && 'rotate-180',
                )}
              />
            </Button>
          )}
        </div>

        <Separator className="bg-zinc-100 dark:bg-zinc-800" />

        {/* Quick Action */}
        <div className={cn('px-3', isMobile ? 'pt-2' : 'pt-3')}>
          {effectiveCollapsed ? (
            <Tooltip>
              <TooltipTrigger>
                <NavLink
                  to="/sales/new"
                  onClick={handleNavigate}
                  className={cn(
                    'inline-flex items-center justify-center rounded-md bg-indigo-600 text-white hover:bg-indigo-700',
                    mobileCollapsedCta,
                  )}
                >
                  <Plus
                    className={isMobile ? 'h-5 w-5' : 'h-4 w-4'}
                    aria-hidden
                  />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">New Sale</TooltipContent>
            </Tooltip>
          ) : (
            <NavLink
              to="/sales/new"
              onClick={handleNavigate}
              className={cn(
                'inline-flex w-full items-center justify-start gap-2 rounded-md bg-indigo-600 px-4 text-white hover:bg-indigo-700',
                mobileNewSaleClass,
              )}
            >
              <Plus
                className={isMobile ? 'h-5 w-5' : 'h-4 w-4'}
                aria-hidden
              />
              New Sale
            </NavLink>
          )}
        </div>

        {/* Navigation */}
        <nav
          aria-label="Primary"
          className={cn(
            'flex-1 overflow-y-auto overscroll-y-contain px-3 py-3',
            isMobile && 'min-h-0',
          )}
        >
          <ul className={cn('space-y-1', isMobile && 'space-y-1.5')}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);
              const isExpanded = expandedGroups.includes(item.label);
              const hasChildren = !!item.children;
              const type = item.type ?? 'button';
              const subnavId = `subnav-${item.label.replace(/\s+/g, '-').toLowerCase()}`;
              const iconSize = isMobile ? 'h-5 w-5' : 'h-4 w-4';
              const chevronSize = isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5';
              const rowInteractive = isMobile
                ? 'touch-manipulation active:bg-zinc-100 dark:active:bg-zinc-800'
                : '';

              return (
                <li key={item.label}>
                  {effectiveCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger>
                        <NavLink
                          to={item.path}
                          onClick={handleNavigate}
                          className={cn(
                            'flex items-center justify-center rounded-md transition-colors',
                            isMobile
                              ? 'min-h-11 min-w-11 p-0'
                              : 'h-9 w-9',
                            active
                              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                              : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50',
                            rowInteractive,
                          )}
                        >
                          <Icon className={iconSize} />
                        </NavLink>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <>
                      {type === 'link' ? (
                        <NavLink
                          to={item.path}
                          onClick={handleNavigate}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors',
                            mobileNavItemClass,
                            active
                              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50',
                            rowInteractive,
                            isMobile && 'text-base',
                          )}
                        >
                          <Icon className={cn(iconSize, 'shrink-0')} />
                          <span className="flex-1 text-left">{item.label}</span>
                          {hasChildren && (
                            <ChevronDown
                              className={cn(
                                chevronSize,
                                'shrink-0 transition-transform',
                                isExpanded && 'rotate-180',
                              )}
                              aria-hidden
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                toggleGroup(item.label);
                              }}
                            />
                          )}
                        </NavLink>
                      ) : (
                        <button
                          type="button"
                          aria-expanded={hasChildren ? isExpanded : undefined}
                          aria-controls={hasChildren ? subnavId : undefined}
                          onClick={() =>
                            hasChildren ? toggleGroup(item.label) : undefined
                          }
                          className={cn(
                            'flex w-full items-center gap-2 rounded-md px-2 text-left text-sm font-medium transition-colors',
                            mobileNavItemClass,
                            active
                              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50',
                            rowInteractive,
                            isMobile && 'text-base',
                          )}
                        >
                          <Icon className={cn(iconSize, 'shrink-0')} />
                          <span className="min-w-0 flex-1 text-left">
                            {item.label}
                          </span>
                          {hasChildren && (
                            <ChevronDown
                              className={cn(
                                chevronSize,
                                'shrink-0 transition-transform',
                                isExpanded && 'rotate-180',
                              )}
                              aria-hidden
                            />
                          )}
                        </button>
                      )}
                      {hasChildren && isExpanded && (
                        <ul id={subnavId} className="overflow-hidden">
                          {item.children!.map((child) => (
                            <li key={child.path + child.label}>
                              <NavLink
                                to={child.path}
                                end
                                onClick={handleNavigate}
                                className={({ isActive }) =>
                                  cn(
                                    'flex w-full items-center rounded-md transition-colors',
                                    mobileSubItemClass,
                                    rowInteractive,
                                    isActive
                                      ? 'text-indigo-600 dark:text-indigo-400'
                                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-200',
                                  )
                                }
                              >
                                {child.label}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div
          className={cn(
            'border-t border-zinc-100 dark:border-zinc-800',
            isMobile
              ? 'p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]'
              : 'p-3',
          )}
        >
          {effectiveCollapsed ? (
            <div
              className={cn(
                'flex items-center justify-center',
                isMobile ? 'min-h-11 min-w-11' : 'h-8 w-8',
              )}
            >
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: isMobile ? 'h-10 w-10' : 'h-8 w-8',
                  },
                }}
              />
            </div>
          ) : (
            <div
              className={cn(
                'flex items-center gap-3',
                isMobile && 'min-h-13',
              )}
            >
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: isMobile ? 'h-10 w-10' : 'h-8 w-8',
                  },
                }}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'truncate font-medium text-zinc-900 dark:text-zinc-50',
                    isMobile ? 'text-base' : 'text-sm',
                  )}
                >
                  {displayName}
                </p>
                <p
                  className={cn(
                    'truncate text-zinc-500',
                    isMobile ? 'text-sm' : 'text-xs',
                  )}
                >
                  Owner
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
