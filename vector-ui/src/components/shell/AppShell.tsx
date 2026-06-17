import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CommandPalette } from './CommandPalette';

interface AppShellProps {
  showPipelineActions?: boolean;
  onValidate?: () => void;
  onSave?: () => void;
  onReload?: () => void;
}

export function AppShell({
  showPipelineActions,
  onValidate,
  onSave,
  onReload,
}: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          showActions={showPipelineActions}
          onValidate={onValidate}
          onSave={onSave}
          onReload={onReload}
        />
        <main className="min-h-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      <CommandPalette
        onValidate={onValidate}
        onSave={onSave}
        onReload={onReload}
      />
      <Toaster position="bottom-right" theme="dark" richColors closeButton />
    </div>
  );
}
