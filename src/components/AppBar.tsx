import { ArrowPathIcon, Bars3Icon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { type Lang, STRINGS } from '../i18n';

interface AppBarProps {
  fileName?: string;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  onRefresh: () => void;
  onOpenSettings: () => void;
  lang: Lang;
}

/** Top bar: [DrawerToggle + HMSP] · filename (reader-column aligned) · [Refresh, Settings]. */
export function AppBar({ fileName, drawerOpen, onToggleDrawer, onRefresh, onOpenSettings, lang }: AppBarProps) {
  const t = STRINGS[lang];
  return (
    <header className="flex h-12 flex-shrink-0 select-none items-center justify-between bg-paper px-3 dark:bg-night sm:px-6">
      <div className="z-10 flex items-center">
        {!drawerOpen && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleDrawer}
              aria-label={t.appBar.openDrawer}
              className="rounded-md p-1.5 text-graphite transition-colors hover:bg-paper-deep dark:text-gray-200 dark:hover:bg-night-hover"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold tracking-tight text-ink dark:text-gray-100">HMSP</span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center">
        <div className="flex w-full max-w-2xl items-center px-6 sm:px-10">
          <span className="block truncate text-left text-xs font-semibold text-ink dark:text-gray-200 sm:text-sm">
            {fileName || t.appBar.noFile}
          </span>
        </div>
      </div>

      <div className="z-10 flex items-center gap-1">
        <button
          type="button"
          onClick={onRefresh}
          aria-label={t.appBar.refresh}
          className="rounded-md p-1.5 text-graphite transition-colors hover:bg-paper-deep dark:text-gray-200 dark:hover:bg-night-hover"
        >
          <ArrowPathIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label={t.appBar.settings}
          className="rounded-md p-1.5 text-graphite transition-colors hover:bg-paper-deep dark:text-gray-200 dark:hover:bg-night-hover"
        >
          <Cog6ToothIcon className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
