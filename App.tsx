

import React from 'react';
// FIX: Reverted to namespace import for react-router-dom to resolve module export issues.
import * as ReactRouterDom from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';
import Pricing from './pages/Pricing';
import Settings from './pages/Settings';
import Blog from './pages/Blog';
import BlogPostEditor from './pages/BlogPostEditor';

function App(): React.ReactElement {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ReactRouterDom.HashRouter>
          <ReactRouterDom.Routes>
            <ReactRouterDom.Route path="/login" element={<Login />} />
            {/* The "/*" route will match everything else and render the protected layout */}
            <ReactRouterDom.Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ReactRouterDom.Routes>
                      <ReactRouterDom.Route path="/" element={<Dashboard />} />
                      <ReactRouterDom.Route path="/messages" element={<Messages />} />
                      <ReactRouterDom.Route path="/pricing" element={<Pricing />} />
                      <ReactRouterDom.Route path="/blog" element={<Blog />} />
                      <ReactRouterDom.Route path="/blog/new" element={<BlogPostEditor />} />
                      <ReactRouterDom.Route path="/blog/edit/:id" element={<BlogPostEditor />} />
                      <ReactRouterDom.Route path="/settings" element={<Settings />} />
                      {/* A catch-all inside the protected layout to redirect to the dashboard */}
                      <ReactRouterDom.Route path="*" element={<ReactRouterDom.Navigate to="/" replace />} />
                    </ReactRouterDom.Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </ReactRouterDom.Routes>
        </ReactRouterDom.HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;