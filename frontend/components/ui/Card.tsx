import type { ElementType, ComponentProps } from 'react';

interface CardProps {
  title: string;
  value: string;
  icon: ElementType;
  isWarning?: boolean;
  onClick?: () => void;
  className?: string;
}

const Card = ({ title, value, icon: Icon, isWarning = false, onClick, className }: CardProps) => {
  const content = (
    <>
      <div>
        <p className="text-sm font-medium text-text-muted text-left">{title}</p>
        <p className={`text-2xl font-bold text-left ${isWarning ? 'text-red-500' : 'text-text-primary'}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-full ${isWarning ? 'bg-red-100 text-red-600' : 'bg-brand-accent/20 text-brand-primary'}`}>
        <Icon className="h-6 w-6" />
      </div>
    </>
  );

  const baseClasses = "bg-surface-card p-6 rounded-lg shadow-sm flex items-center justify-between w-full";

  if (onClick) {
    return (
      <button 
        onClick={onClick} 
        className={`${baseClasses} cursor-pointer hover:shadow-md hover:scale-[1.02] transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2 ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`${baseClasses} ${className}`}>
      {content}
    </div>
  );
};

export default Card;