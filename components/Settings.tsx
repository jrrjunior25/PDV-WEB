import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SystemSettings } from '../types';
import Button from './ui/Button';
import Input from './ui/Input';
import { useAuth } from '../auth/AuthContext';
import { AlertTriangleIcon } from './icons/Icon';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Partial<SystemSettings>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'administrador') {
      const fetchSettings = async () => {
        setLoading(true);
        try {
          const data = await api.getSettings();
          setSettings(data);
        } catch (error) {
          console.error("Failed to fetch settings", error);
        } finally {
          setLoading(false);
        }
      };
      fetchSettings();
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.saveSettings(settings as SystemSettings);
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error("Failed to save settings", error);
      alert('Erro ao salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  if (user?.role !== 'administrador') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center bg-yellow-50 border border-yellow-200 text-yellow-800 p-8 rounded-lg">
        <AlertTriangleIcon className="h-12 w-12 mb-4" />
        <h2 className="text-2xl font-bold">Acesso Negado</h2>
        <p className="mt-2">Você não tem permissão para visualizar esta página.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-primary"></div></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-text-primary">Configurações do Sistema</h1>
      
      <div className="bg-surface-card p-6 rounded-lg shadow-sm">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-text-primary border-b pb-2">Dados da Empresa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <Input name="companyName" label="Nome da Empresa" value={settings.companyName || ''} onChange={handleInputChange} />
            <Input name="cnpj" label="CNPJ" value={settings.cnpj || ''} onChange={handleInputChange} />
            <Input name="address" label="Endereço Completo" value={settings.address || ''} onChange={handleInputChange} />
            <Input name="phone" label="Telefone" value={settings.phone || ''} onChange={handleInputChange} />
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-text-primary border-b pb-2">Configurações Fiscais e de Pagamento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div>
              <label htmlFor="taxRegime" className="block text-sm font-medium text-text-secondary mb-1">Regime Tributário</label>
              <select
                id="taxRegime"
                name="taxRegime"
                value={settings.taxRegime || 'Simples Nacional'}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent transition bg-white"
              >
                <option>Simples Nacional</option>
                <option>Lucro Presumido</option>
                <option>Lucro Real</option>
              </select>
            </div>
            <Input name="pixKey" label="Chave PIX" value={settings.pixKey || ''} onChange={handleInputChange} placeholder="E-mail, CPF/CNPJ, Telefone ou Chave Aleatória"/>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <Button onClick={handleSave} isLoading={isSaving}>
            Salvar Configurações
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;