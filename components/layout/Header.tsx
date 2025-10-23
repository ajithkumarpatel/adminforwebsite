
import React, { useState } from 'react';
// FIX: Using named import for react-router-dom to resolve module export issues.
import { useNavigate } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';

interface HeaderProps {
  setSidebarOpen: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/messages?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/messages');
    }
  };

  return (
    <header className="flex-shrink-0 flex justify-between items-center p-4 bg-white dark:bg-gray-900 border-b dark:border-gray-700">
      <button
        onClick={() => setSidebarOpen(true)}
        className="text-gray-500 focus:outline-none md:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={24} />
      </button>

      <div className="flex-1 flex justify-end">
        <form onSubmit={handleSearch} className="relative w-full max-w-xs">
          <label htmlFor="global-search" className="sr-only">Search</label>
          <input
            id="global-search"
            type="search"
            name="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search messages..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
        </form>
      </div>
    </header>
  );
};

export default Header;
