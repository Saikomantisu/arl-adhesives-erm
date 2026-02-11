import { Outlet } from 'react-router';
import { AppSidebar } from '~/components/layouts/app-sidebar';
import { Sheet, SheetContent } from '~/components/ui/sheet';
import { useUiStore } from '~/store/ui-store';

export default function DashboardLayout() {
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <div className='flex min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950'>
      <div className='hidden md:block'>
        <AppSidebar />
      </div>

      {/* Mobile navigation drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side='left'
          showCloseButton={false}
          className='p-0 w-80 max-w-[85vw]'
        >
          <AppSidebar variant='mobile' onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>
      {/* 
        ml-64 matches expanded sidebar (256px).
        The sidebar animates, but content stays offset.
        Framer Motion on sidebar handles the visual transition.
      */}
      <main className='min-w-0 flex-1 ml-0 md:ml-64'>
        <Outlet />
      </main>
    </div>
  );
}
