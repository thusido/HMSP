import { ArrowPathIcon, Bars3Icon, Cog6ToothIcon } from '@heroicons/react/24/outline';

interface AppBarProps {
  fileName?: string;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  onRefresh: () => void;
  onOpenSettings: () => void;
}

/** Top bar: [DrawerToggle + HMSP] · filename (reader-column aligned) · [Refresh, Settings]. */
export function AppBar({ fileName, drawerOpen, onToggleDrawer, onRefresh, onOpenSettings }: AppBarProps) {
  return (
    <header className="flex h-12 flex-shrink-0 select-none items-center justify-between bg-chrome-light px-3 dark:bg-gray-900 sm:px-6">
      <div className="z-10 flex items-center">
        {!drawerOpen && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleDrawer}
              aria-label="Open playlist drawer"
              className="rounded-md p-1.5 text-gray-700 transition-colors hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold tracking-tight text-gray-800 dark:text-gray-100">HMSP</span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center">
        <div className="flex w-full max-w-2xl items-center px-6 sm:px-10">
          <span className="block truncate text-left text-xs font-semibold text-gray-800 dark:text-gray-200 sm:text-sm">
            {fileName || 'No file selected'}
          </span>
        </div>
      </div>

      <div className="z-10 flex items-center gap-1">
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Refresh playlist references"
          className="rounded-md p-1.5 text-gray-700 transition-colors hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <ArrowPathIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Settings"
          className="rounded-md p-1.5 text-gray-700 transition-colors hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <Cog6ToothIcon className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
