
import React from 'react';
// FIX: Using named imports for react-router-dom to resolve module export issues.
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            {/* The "/*" route will match everything else and render the protected layout */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/messages" element={<Messages />} />
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/new" element={<BlogPostEditor />} />
                      <Route path="/blog/edit/:id" element={<BlogPostEditor />} />
                      <Route path="/settings" element={<Settings />} />
                      {/* A catch-all inside the protected layout to redirect to the dashboard */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
