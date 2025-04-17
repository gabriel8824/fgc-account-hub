
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  FolderOpen, 
  Users, 
  BarChart, 
  Settings,
  PlusCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const Sidebar = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = isAdmin
    ? [
        { icon: Home, label: 'Dashboard', path: '/dashboard' },
        { icon: Users, label: 'Beneficiários', path: '/beneficiaries' },
        { icon: FolderOpen, label: 'Projetos', path: '/projects' },
        { icon: FileText, label: 'Relatórios', path: '/reports' },
        { icon: BarChart, label: 'Estatísticas', path: '/statistics' },
        { icon: Settings, label: 'Configurações', path: '/settings' },
      ]
    : [
        { icon: Home, label: 'Dashboard', path: '/dashboard' },
        { icon: FolderOpen, label: 'Meus Projetos', path: '/projects' },
        { icon: FileText, label: 'Meus Relatórios', path: '/reports' },
        { icon: Settings, label: 'Configurações', path: '/settings' },
      ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen hidden md:block">
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <span className="font-bold text-2xl text-fgc-700">FGC</span>
            <span className="text-sm font-semibold text-gray-500">Account</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={cn(
                "flex items-center px-4 py-3 text-gray-600 rounded-md hover:bg-fgc-50 hover:text-fgc-700 transition-colors",
                isActive(item.path) && "bg-fgc-50 text-fgc-700 font-medium"
              )}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </Link>
          ))}
        </nav>

        {!isAdmin && (
          <div className="p-4 border-t border-gray-200">
            <Button asChild className="w-full bg-fgc-600 hover:bg-fgc-700">
              <Link to="/reports/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                Novo Relatório
              </Link>
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
