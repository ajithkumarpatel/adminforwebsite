
import React from 'react';
// FIX: Using named imports for react-router-dom to resolve module export issues.
import { useNavigate, NavLink } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { LayoutDashboard, MessageSquare, Tag, LogOut, Code, X, Settings, Sun, Moon, Newspaper } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout Error:', error);
      alert('Failed to log out.');
    }
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }): string =>
    `flex items-center px-4 py-2.5 rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-primary-700 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      ></div>
      <aside
        className={`fixed inset-y-0 left-0 bg-gray-800 dark:bg-gray-900 text-white w-64 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-30 flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Code className="text-primary-400" size={28} />
            <span className="text-xl font-semibold">BroTech Admin</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {/* Use the `end` prop for root NavLink to avoid it being active for all child routes */}
          <NavLink to="/" className={navLinkClasses} end>
            <LayoutDashboard className="mr-3" size={20} />
            Dashboard
          </NavLink>
          <NavLink to="/messages" className={navLinkClasses}>
            <MessageSquare className="mr-3" size={20} />
            Contact Messages
          </NavLink>
           <NavLink to="/blog" className={navLinkClasses}>
            <Newspaper className="mr-3" size={20} />
            Blog Posts
          </NavLink>
          <NavLink to="/pricing" className={navLinkClasses}>
            <Tag className="mr-3" size={20} />
            Pricing Plans
          </NavLink>
          <NavLink to="/settings" className={navLinkClasses}>
            <Settings className="mr-3" size={20} />
            Site Settings
          </NavLink>
        </nav>
        <div className="px-4 py-4 border-t border-gray-700">
          <button
            onClick={toggleTheme}
            className="flex items-center w-full px-4 py-2.5 text-left text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors duration-200 mb-2"
          >
            {theme === 'light' ? <Moon className="mr-3" size={20} /> : <Sun className="mr-3" size={20} />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2.5 text-left text-gray-300 rounded-lg hover:bg-red-600 hover:text-white transition-colors duration-200"
          >
            <LogOut className="mr-3" size={20} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
