import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Trophy, User, LogOut, Home, Compass } from 'lucide-react';
import { cn } from '../lib/utils';

export function Layout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              A
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">AprovaJá</span>
          </Link>

          {profile ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 mr-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">{profile.displayName}</p>
                  <p className="text-xs text-slate-500">Nível {profile.level} • {profile.xp} XP</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                  {profile.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Entrar
              </Link>
              <Link to="/login" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors">
                Começar Grátis
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 pb-24 md:pb-6">
        <Outlet />
      </main>

      {/* Mobile Navigation */}
      {profile && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 px-2 z-50">
          <NavLink to="/dashboard" icon={<Home />} label="Início" />
          <NavLink to="/simulados" icon={<BookOpen />} label="Simulados" />
          <NavLink to="/desempenho" icon={<Trophy />} label="Desempenho" />
          <NavLink to="/planos" icon={<Compass />} label="Planos" />
        </nav>
      )}
    </div>
  );
}

function NavLink({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  return (
    <Link 
      to={to} 
      className={cn(
        "flex flex-col items-center justify-center w-full h-full gap-1",
        window.location.pathname === to ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"
      )}
    >
      <div className="w-5 h-5">{icon}</div>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
