import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Factory, LayoutDashboard, Upload, Search, FileText,
  Code2, Settings, BarChart3,
  ChevronsLeft, ChevronsRight, HelpCircle, ClipboardCheck, FileEdit,
  LogOut, ShieldCheck, UserCheck, UserPen, Heart, Activity, BookOpen, StickyNote, FileUser, MessageSquare, ListChecks, Monitor, Award, Briefcase, Contact, Vote, CalendarDays, Megaphone, CalendarCheck, Link, ClipboardList, NotebookPen
} from 'lucide-react';
import { fetchStats, fetchAssets } from '../services/api';
import { useAuth } from '../context/AuthContext';

const getNavSections = (role) => {
  const main = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/browse', icon: Search, label: 'Browse Assets' },
    { to: '/upload', icon: Upload, label: 'Contribute' },
    { to: '/approvals', icon: ClipboardCheck, label: 'Approvals' },
  ];

  // Admin gets full Review Queue via Approvals page
  if (role === 'admin') {
    // No separate Review Queue needed - Approvals handles it
  }

  if (role !== 'admin') {
    main.push({ to: '/drafts', icon: FileEdit, label: 'Drafts' });
  }

  return [
    { title: 'Main', items: main },
    {
      title: 'Library',
      items: [
        { to: '/code', icon: Code2, label: 'Code Snippets' },
        { to: '/documents', icon: FileText, label: 'Documents' },
        { to: '/favorites', icon: Heart, label: 'My Favorites' },
        { to: '/notes', icon: StickyNote, label: 'Personal Notes' },
        { to: '/resume', icon: FileUser, label: 'Resume Builder' },
        { to: '/tasks', icon: ListChecks, label: 'Daily Tasks' },
      ],
    },
    {
      title: 'Insights',
      items: [
        { to: '/analytics', icon: BarChart3, label: 'Analytics' },
        { to: '/activity', icon: Activity, label: 'Activity Log' },
        { to: '/feedback', icon: MessageSquare, label: 'Open Feedback' },
        { to: '/devices', icon: Monitor, label: 'Asset Management' },
        { to: '/recognition', icon: Award, label: 'Recognition Wall' },
        { to: '/directory', icon: Contact, label: 'Employee Directory' },
        { to: '/ask-expert', icon: HelpCircle, label: 'Ask an Expert' },
        { to: '/polls', icon: Vote, label: 'Polls & Surveys' },
        { to: '/leave', icon: CalendarDays, label: 'Leave / WFH Tracker' },
        { to: '/announcements', icon: Megaphone, label: 'Announcements' },
        { to: '/bookings', icon: CalendarCheck, label: 'Room Booking' },
        { to: '/quicklinks', icon: Link, label: 'Quick Links' },
        { to: '/standups', icon: ClipboardList, label: 'Standup Notes' },
        { to: '/meetings', icon: NotebookPen, label: 'Meeting Minutes' },
        { to: '/jobs', icon: Briefcase, label: 'Internal Job Board' },
        ...(role === 'admin' ? [
          { to: '/knowledge', icon: BookOpen, label: 'EB Knowledge Base' },
        ] : []),
      ],
    },
  ];
};

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-64';
  const [pendingCount, setPendingCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const { user, logout, isApprover } = useAuth();
  const navSections = getNavSections(user?.role);

  const roleLabel = user?.role === 'admin' ? 'Admin' : isApprover ? 'Approver' : 'Member';
  const roleColor = user?.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : isApprover ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';

  const refreshCounts = () => {
    fetchStats().then(stats => {
      setPendingCount(stats?.byStatus?.['Under Review'] || 0);
    }).catch(() => {});
    // Draft count: only count drafts/rejected belonging to current user
    Promise.all([
      fetchAssets({ status: 'Draft' }),
      fetchAssets({ status: 'Rejected' }),
    ]).then(([drafts, rejected]) => {
      const isOwner = a => a.author === user?.name || a.submittedBy === user?.username || a.submittedBy === user?.name;
      setDraftCount(drafts.filter(isOwner).length + rejected.filter(isOwner).length);
    }).catch(() => setDraftCount(0));
  };

  useEffect(() => {
    refreshCounts();
    const handler = () => refreshCounts();
    window.addEventListener('assets-updated', handler);
    return () => window.removeEventListener('assets-updated', handler);
  }, []);

  const navContent = (
    <aside className={`h-screen bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-gray-200/60 dark:border-slate-800/80 flex flex-col transition-all duration-300 ${sidebarWidth}`}>
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-4 border-b border-gray-100/80 dark:border-slate-800 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/25 ring-1 ring-white/10">
          <Factory className="w-5 h-5 text-white" />
        </div>
        {!collapsed && <span className="font-black text-lg text-gray-900 dark:text-white truncate tracking-tight">Knowledge Factory</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {navSections.map((section, si) => (
          <div key={si} className={si > 0 ? 'mt-5' : ''}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                {section.title}
              </p>
            )}
            {collapsed && si > 0 && <div className="mx-3 mb-2 border-t border-gray-100 dark:border-slate-700" />}
            <div className="space-y-0.5">
              {section.items.map(item => {
                const badge = (item.to === '/review' || item.to === '/approvals') && isApprover ? pendingCount : item.to === '/drafts' ? draftCount : 0;
                return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onMobileClose}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `relative group flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      collapsed ? 'justify-center px-0 py-2.5 mx-1' : 'px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-50 to-primary-100/60 dark:from-primary-900/40 dark:to-primary-900/20 text-primary-700 dark:text-primary-400 shadow-sm shadow-primary-100/50 dark:shadow-none border border-primary-100 dark:border-primary-800/50 font-semibold'
                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50/80 dark:hover:bg-slate-800/70 hover:text-gray-900 dark:hover:text-white border border-transparent hover:scale-[1.01]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && !collapsed && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-500 rounded-r-full" />}
                      <item.icon className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />
                      {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                      {!collapsed && badge > 0 && (
                        <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 animate-badge-bounce">
                          {badge}
                        </span>
                      )}
                      {collapsed && badge > 0 && (
                        <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-glow-pulse" />
                      )}
                    </>
                  )}
                </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-100 dark:border-slate-700 p-2 space-y-0.5">
        <NavLink
          to="/settings"
          onClick={onMobileClose}
          title={collapsed ? 'Settings' : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              collapsed ? 'justify-center px-0 py-2.5 mx-1' : 'px-3 py-2.5'
            } ${isActive ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white'}`
          }
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        <button
          title={collapsed ? 'Help' : undefined}
          className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white transition-all duration-200 ${
            collapsed ? 'justify-center px-0 py-2.5 mx-1' : 'px-3 py-2.5'
          }`}
        >
          <HelpCircle className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Help & Docs</span>}
        </button>
      </div>

      {/* User section */}
      <div className="p-3 border-t border-gray-100/80 dark:border-slate-800">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-2.5 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-slate-800/80 dark:to-slate-800/50 border border-gray-100/50 dark:border-slate-700/30`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 flex items-center justify-center text-white text-sm font-bold shrink-0 ring-2 ring-white dark:ring-slate-900 shadow-md shadow-primary-500/20">
            {user?.initials || 'KF'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name || 'User'}</p>
              <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roleColor}`}>{roleLabel}</span>
            </div>
          )}
          {!collapsed && (
            <button onClick={logout} title="Logout" className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <button onClick={logout} title="Logout" className="w-full mt-2 flex justify-center p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={onToggle}
        className="hidden md:flex h-10 items-center justify-center border-t border-gray-100 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
      </button>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block fixed left-0 top-0 z-40">
        {navContent}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onMobileClose} />
          <div className="relative w-64 animate-slide-in">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
