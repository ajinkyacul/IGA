import { MessageSquare, Paperclip, Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ActivityProps {
  activity: {
    type: string;
    user?: {
      id: number;
      fullName: string;
      role: string;
    };
    questionTitle?: string;
    questionId?: number;
    date: string;
  };
}

export default function ActivityItem({ activity }: ActivityProps) {
  // Format date relative to now (e.g., "2 hours ago")
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get initials for avatar
  const getInitials = (name: string = 'User') => {
    return name.split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  // Determine icon and color based on activity type
  const getActivityTypeConfig = (type: string) => {
    switch (type) {
      case 'response':
        return {
          icon: <MessageSquare className="h-4 w-4" />,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-600'
        };
      case 'file':
        return {
          icon: <Paperclip className="h-4 w-4" />,
          bgColor: 'bg-green-100',
          textColor: 'text-green-600'
        };
      case 'notification':
        return {
          icon: <Bell className="h-4 w-4" />,
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-600'
        };
      default:
        return {
          icon: <MessageSquare className="h-4 w-4" />,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-600'
        };
    }
  };

  const { icon, bgColor, textColor } = getActivityTypeConfig(activity.type);

  // Generate activity description
  const getActivityDescription = () => {
    if (!activity.user) return 'Activity recorded';
    
    switch (activity.type) {
      case 'response':
        return `${activity.user.fullName} posted a comment on "${activity.questionTitle}"`;
      case 'file':
        return `${activity.user.fullName} uploaded a file to "${activity.questionTitle}"`;
      case 'notification':
        return `New notification for "${activity.questionTitle}"`;
      default:
        return `${activity.user.fullName} interacted with "${activity.questionTitle}"`;
    }
  };

  return (
    <li className="flex items-start p-2 hover:bg-slate-50 rounded">
      {activity.user ? (
        <Avatar className="h-9 w-9 mr-3">
          <AvatarFallback className={cn(bgColor, textColor)}>
            {getInitials(activity.user.fullName)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className={cn("flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center mr-3", bgColor, textColor)}>
          {icon}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">
          {getActivityDescription()}
        </p>
        <p className="text-xs text-slate-500">
          {activity.user ? `${activity.user.role} • ` : ''}
          {formatRelativeTime(activity.date)}
        </p>
      </div>
    </li>
  );
}
