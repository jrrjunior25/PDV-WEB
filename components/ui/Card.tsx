
import React from 'react';

interface CardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  isWarning?: boolean;
}

const Card: React.FC<CardProps> = ({ title, value, icon: Icon, isWarning = false }) => {
  return (
    <div className="bg-surface-card p-6 rounded-lg shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-text-muted">{title}</p>
        <p className={`text-2xl font-bold ${isWarning ? 'text-red-500' : 'text-text-primary'}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-full ${isWarning ? 'bg-red-100 text-red-600' : 'bg-brand-accent/20 text-brand-primary'}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
};

export default Card;
