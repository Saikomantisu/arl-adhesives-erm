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
} from 'lucide-react';
import { cn } from '~/lib/utils';
import { useState } from 'react';
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

  return (
    <TooltipProvider>
      <aside
        className={cn(
          isMobile
            ? 'flex h-full flex-col'
            : 'fixed left-0 top-0 z-40 flex h-screen flex-col',
          'border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950',
          effectiveCollapsed ? 'w-16' : 'w-64',
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-3">
          {!effectiveCollapsed && (
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center
                  rounded-lg bg-indigo-600 text-white"
              >
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                ARL Adhesives
              </span>
            </div>
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
        <div className="px-3 pt-3">
          {effectiveCollapsed ? (
            <Tooltip>
              <TooltipTrigger>
                <NavLink
                  to="/sales/new"
                  onClick={handleNavigate}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">New Sale</TooltipContent>
            </Tooltip>
          ) : (
            <NavLink
              to="/sales/new"
              onClick={handleNavigate}
              className="inline-flex w-full items-center justify-start gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              New Sale
            </NavLink>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);
              const isExpanded = expandedGroups.includes(item.label);
              const hasChildren = !!item.children;
              const type = item.type ?? 'button';

              return (
                <li key={item.label}>
                  {effectiveCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger>
                        <NavLink
                          to={item.path}
                          onClick={handleNavigate}
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                            active
                              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                              : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50',
                          )}
                        >
                          <Icon className="h-4 w-4" />
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
                            'flex w-full items-center gap-2 rounded-md px-2 h-9 text-sm font-medium transition-colors',
                            active
                              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50',
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1 text-left">{item.label}</span>
                          {hasChildren && (
                            <ChevronDown
                              className={cn(
                                'h-3.5 w-3.5 transition-transform',
                                isExpanded && 'rotate-180',
                              )}
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
                          onClick={() =>
                            hasChildren ? toggleGroup(item.label) : undefined
                          }
                          className={cn(
                            'flex w-full items-center gap-2 rounded-md px-2 h-9 text-sm font-medium transition-colors',
                            active
                              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50',
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1 text-left">{item.label}</span>
                          {hasChildren && (
                            <ChevronDown
                              className={cn(
                                'h-3.5 w-3.5 transition-transform',
                                isExpanded && 'rotate-180',
                              )}
                            />
                          )}
                        </button>
                      )}
                      {hasChildren && isExpanded && (
                        <ul className="overflow-hidden">
                          {item.children!.map((child) => (
                            <li key={child.path + child.label}>
                              <NavLink
                                to={child.path}
                                end
                                onClick={handleNavigate}
                                className={({ isActive }) =>
                                  cn(
                                    'flex h-8 w-full items-center rounded-md pl-8 pr-2 text-[13px] transition-colors',
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
        <div className="border-t border-zinc-100 p-3 dark:border-zinc-800">
          {effectiveCollapsed ? (
            <div className="flex h-8 w-8 items-center justify-center">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'h-8 w-8',
                  },
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'h-8 w-8',
                  },
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {displayName}
                </p>
                <p className="truncate text-xs text-zinc-500">Owner</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
