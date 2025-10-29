
import Layout from '../components/Layout';
import Login from '../components/Login';
import Notifications from '../components/ui/Notifications';
import { DataProvider } from '../contexts/DataContext';
import { NotificationProvider } from '../contexts/NotificationContext';
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
      <NotificationProvider>
        <DataProvider>
          <AppContent />
          <Notifications />
        </DataProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;