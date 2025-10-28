import React from 'react';
import Layout from './components/Layout';
import Login from './components/Login';
import { AuthProvider, useAuth } from './auth/AuthContext';

// O componente principal que gerencia a navegação e o estado de autenticação.
const AppContent = () => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated || !user) {
    return <Login />;
  }

  return <Layout />;
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;