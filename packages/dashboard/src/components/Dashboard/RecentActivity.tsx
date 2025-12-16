import React from 'react';
import { Phone, MessageSquare, Clock } from 'lucide-react';

interface Activity {
  id: number;
  type: string;
  title: string;
  time: string;
  status: string;
}

interface RecentActivityProps {
  activities?: Activity[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities = [] }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4 text-voxlink-blue" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4 text-link-teal" />;
      default:
        return <Clock className="w-4 h-4 text-slate" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success">Completed</span>;
      case 'new':
        return <span className="badge badge-info">New</span>;
      case 'missed':
        return <span className="badge badge-error">Missed</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  const defaultActivities = [
    {
      id: 1,
      type: 'call',
      title: 'Incoming call from +1 (555) 123-4567',
      time: '2 minutes ago',
      status: 'completed',
    },
    {
      id: 2,
      type: 'sms',
      title: 'SMS received from +1 (555) 987-6543',
      time: '5 minutes ago',
      status: 'new',
    },
    {
      id: 3,
      type: 'call',
      title: 'Outbound call to +1 (555) 456-7890',
      time: '8 minutes ago',
      status: 'completed',
    },
    {
      id: 4,
      type: 'call',
      title: 'Missed call from +1 (555) 321-0987',
      time: '15 minutes ago',
      status: 'missed',
    },
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Recent Activity</h3>
        <p className="card-subtitle">Latest calls and messages</p>
      </div>
      
      <div className="space-y-4">
        {displayActivities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex-shrink-0 mt-1">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-charcoal truncate">
                {activity.title}
              </p>
              <p className="text-xs text-slate mt-1">
                {activity.time}
              </p>
            </div>
            <div className="flex-shrink-0">
              {getStatusBadge(activity.status)}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="text-sm text-voxlink-blue hover:text-blue-700 font-medium">
          View all activity
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;