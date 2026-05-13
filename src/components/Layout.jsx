import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChatBox from './ChatBox';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 transition-colors duration-300">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <main
        className={`flex-1 min-h-screen transition-all duration-300 ease-out ${
          collapsed ? 'md:ml-[72px]' : 'md:ml-64'
        }`}
      >
        <div className="animate-page-enter min-h-screen" key={location.pathname}>
          <Outlet context={{ onMenuClick: () => setMobileOpen(true) }} />
        </div>
      </main>
      <ChatBox />
    </div>
  );
}
