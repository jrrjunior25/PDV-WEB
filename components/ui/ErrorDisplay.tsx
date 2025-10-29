import React from 'react';
import { AlertTriangleIcon } from '../icons/Icon';
import Button from './Button';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

const ErrorDisplay = ({ message, onRetry }: ErrorDisplayProps) => (
  <div className="flex flex-col items-center justify-center text-center bg-red-50 border border-red-200 text-red-800 p-8 rounded-lg">
    <AlertTriangleIcon className="h-12 w-12 mb-4" />
    <h2 className="text-xl font-bold">Ocorreu um Erro</h2>
    <p className="mt-2 mb-6 max-w-md">{message}</p>
    {onRetry && (
      <Button variant="danger" onClick={onRetry}>
        Tentar Novamente
      </Button>
    )}
  </div>
);

export default ErrorDisplay;
