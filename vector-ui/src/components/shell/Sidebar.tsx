import { NavLink } from 'react-router-dom';
import {
  Activity,
  BookTemplate,
  ChevronLeft,
  ChevronRight,
  FileCode2,
  GitBranch,
  ScrollText,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAppStore } from '../../stores/appStore';

const navItems = [
  { to: '/builder', label: 'Pipeline Builder', icon: GitBranch },
  { to: '/vrl/default', label: 'VRL Editor', icon: FileCode2 },
  { to: '/monitor', label: 'Live Monitor', icon: Activity },
  { to: '/templates', label: 'Templates', icon: BookTemplate },
  { to: '/audit', label: 'Audit Log', icon: ScrollText },
];

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-border bg-bg2 transition-[width] duration-200',
        collapsed ? 'w-14' : 'w-56',
      )}
    >
      <div className="flex h-12 items-center justify-between border-b border-border px-3">
        {!collapsed && (
          <span className="font-display text-base text-accent">Vector UI</span>
        )}
        <button
          onClick={toggleSidebar}
          className="rounded p-1.5 text-text2 hover:bg-bg3 hover:text-text"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2" aria-label="Main navigation">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded px-2.5 py-2 font-body text-sm transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
                isActive
                  ? 'bg-bg3 text-text'
                  : 'text-text2 hover:bg-bg3 hover:text-text',
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
