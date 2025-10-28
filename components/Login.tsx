import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import Input from './ui/Input';
import Button from './ui/Button';
import { ShoppingCartIcon, AlertTriangleIcon } from './icons/Icon';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      // O AuthProvider irá redirecionar
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-main">
      <div className="w-full max-w-md p-8 space-y-8 bg-surface-card rounded-xl shadow-lg">
        <div className="text-center">
            <ShoppingCartIcon className="mx-auto h-12 w-auto text-brand-primary"/>
            <h2 className="mt-6 text-3xl font-extrabold text-text-primary">
                Acesse sua conta
            </h2>
            <p className="mt-2 text-sm text-text-muted">
                Bem-vindo ao PDV Inteligente
            </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Endereço de e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="pt-4">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center p-3 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                <AlertTriangleIcon className="flex-shrink-0 inline w-5 h-5 mr-3"/>
                <span className="font-medium">{error}</span>
            </div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Entrar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;