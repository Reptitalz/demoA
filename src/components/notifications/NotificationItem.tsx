
"use client";

import { AppNotification } from '@/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';
import Link from 'next/link';

interface NotificationItemProps {
  notification: AppNotification;
}

const typeConfig = {
  success: { icon: FaCheckCircle, color: 'text-green-500' },
  error: { icon: FaTimesCircle, color: 'text-destructive' },
  warning: { icon: FaExclamationTriangle, color: 'text-orange-500' },
  info: { icon: FaInfoCircle, color: 'text-primary' },
};

const NotificationItem = ({ notification }: NotificationItemProps) => {
  const { icon: Icon, color } = typeConfig[notification.type] || typeConfig.info;

  const content = (
      <div
        className={cn(
          "flex items-start gap-3 p-3 transition-colors hover:bg-muted/50 rounded-md",
          !notification.read && "bg-primary/5"
        )}
      >
        <div className="relative">
          <Icon className={cn("h-5 w-5 mt-0.5", color)} />
          {!notification.read && (
            <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm text-foreground">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es })}
          </p>
        </div>
      </div>
  );
  
  if (notification.link) {
    return <Link href={notification.link} className="cursor-pointer">{content}</Link>;
  }

  return <div className="cursor-default">{content}</div>;
};

export default NotificationItem;
