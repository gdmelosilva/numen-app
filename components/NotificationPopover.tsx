"use client"

import * as React from "react";
import { Bell, X, Info, Megaphone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import type { Notification } from "@/hooks/useNotifications";

function getNotificationIcon(type: Notification["type"], severity: Notification["severity"]) {
  // Determinar cor baseada na severity
  const getColorClass = () => {
    switch (severity) {
      case "critical":
        return "text-red-500";
      case "high":
        return "text-orange-500";
      case "medium":
        return "text-yellow-500";
      case "low":
      default:
        return "text-blue-500";
    }
  };

  const colorClass = getColorClass();

  // Determinar ícone baseado no type
  // Mapeamento: error=ALERT(sino), warning=SYSTEM(info), info=ANNOUNCEMENT(megafone), success=REMINDER(relógio)
  switch (type) {
    case "error": // ALERT
      return <Bell className={`h-4 w-4 ${colorClass}`} />;
    case "warning": // SYSTEM
      return <Info className={`h-4 w-4 ${colorClass}`} />;
    case "info": // ANNOUNCEMENT
      return <Megaphone className={`h-4 w-4 ${colorClass}`} />;
    case "success": // REMINDER
    default:
      return <Clock className={`h-4 w-4 ${colorClass}`} />;
  }
}

// function getSeverityColor(severity: Notification["severity"]) {
//   switch (severity) {
//     case "critical":
//       return "text-red-600";
//     case "high":
//       return "text-orange-600";
//     case "medium":
//       return "text-yellow-600";
//     case "low":
//     default:
//       return "text-blue-600";
//   }
// }

function getSeverityBorderColor(severity: Notification["severity"]) {
  switch (severity) {
    case "critical":
      return "border-red-200 hover:border-red-300";
    case "high":
      return "border-orange-200 hover:border-orange-300";
    case "medium":
      return "border-yellow-200 hover:border-yellow-300";
    case "low":
    default:
      return "border-blue-200 hover:border-blue-300";
  }
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "Agora";
  if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h atrás`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d atrás`;
  
  return date.toLocaleDateString('pt-BR');
}

export function NotificationPopover() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useNotifications();
  
  const [isOpen, setIsOpen] = React.useState(false);

  const handleNotificationClick = async (notification: Notification) => {
    // Marcar como lida se ainda não foi lida
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navegar para a URL se existir
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
    
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDismissNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await dismissNotification(notificationId);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-red-600 text-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Notificações</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="text-xs h-auto p-1"
              disabled={loading}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm">Carregando...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "group relative p-3 rounded-lg border transition-colors cursor-pointer",
                    getSeverityBorderColor(notification.severity),
                    notification.read 
                      ? "bg-muted/30" 
                      : "bg-background hover:bg-muted/50",
                    notification.action_url && "hover:bg-muted/70"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type, notification.severity)}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={cn(
                          "text-sm font-medium leading-tight",
                          notification.read && "text-muted-foreground"
                        )}>
                          {notification.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDismissNotification(notification.id, e)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <p className={cn(
                        "text-xs leading-relaxed",
                        notification.read ? "text-muted-foreground" : "text-foreground"
                      )}>
                        {notification.text}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        {/* <Badge 
                          variant="outline" 
                          className={cn("text-xs", getSeverityColor(notification.severity))}
                        >
                          {notification.severity}
                        </Badge> */}
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {!notification.read && (
                    <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            {/* <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => {
                // Navegar para página de todas as notificações (implementar depois)
                setIsOpen(false);
              }}
            >
              Ver todas as notificações
            </Button> */}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
