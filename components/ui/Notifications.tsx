import { useNotifications } from '../../contexts/NotificationContext';
import { AlertTriangleIcon, CheckCircle2Icon, InfoIcon, XIcon } from './Icon';

const notificationIcons = {
  success: <CheckCircle2Icon className="h-6 w-6 text-green-500" />,
  error: <AlertTriangleIcon className="h-6 w-6 text-red-500" />,
  info: <InfoIcon className="h-6 w-6 text-blue-500" />,
  warning: <AlertTriangleIcon className="h-6 w-6 text-yellow-500" />,
};

const notificationStyles = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
  warning: 'bg-yellow-50 border-yellow-200',
};

const Notifications = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`relative flex items-start p-4 border rounded-lg shadow-lg animate-fade-in-right ${notificationStyles[notification.type]}`}
        >
          <div className="flex-shrink-0">
            {notificationIcons[notification.type]}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">{notification.message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => removeNotification(notification.id)}
              className="inline-flex text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Fechar</span>
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Notifications;

// Adicionando as animações necessárias no CSS global (simulado aqui, mas seria em um arquivo .css)
const styles = `
@keyframes fade-in-right {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.animate-fade-in-right {
  animation: fade-in-right 0.3s ease-out forwards;
}
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);