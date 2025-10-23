


import React from 'react';
// FIX: Reverted to namespace import for react-router-dom to resolve module export issues.
import * as ReactRouterDom from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // The AuthProvider already shows a loading screen
  }

  if (!user) {
    // Navigate to the login page if the user is not authenticated.
    // `replace` prevents the user from navigating back to the protected page.
    return <ReactRouterDom.Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;