import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface AlertProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ title, children, className }) => {
  return (
    <div className={`p-4 border-l-4 rounded-md bg-red-50 dark:bg-red-900/20 border-red-400 ${className}`} role="alert">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="text-red-500 h-5 w-5" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{title}</h3>
          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alert;
