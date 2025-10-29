import Layout from '../components/Layout';
import Login from '../components/Login';
import { AuthProvider, useAuth } from './AuthContext';

// O componente principal que gerencia a navegação e o estado de autenticação.
// Foi movido para fora do componente App para seguir as melhores práticas do React.
function AppContent() {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated || !user) {
    return <Login />;
  }

  return <Layout />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;