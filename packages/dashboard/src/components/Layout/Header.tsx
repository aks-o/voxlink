import React, { useState } from 'react';
import { 
  Menu, 
  Bell, 
  Search, 
  User, 
  Settings, 
  LogOut,
  ChevronDown,
  Phone,
  MessageSquare,
  Activity
} from 'lucide-react';
import { useAuth } from '@utils/auth';

interface HeaderProps {
  onMenuClick: () => void;
  user: any;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, user }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { logout } = useAuth();

  const notifications = [
    {
      id: 1,
      type: 'call',
      title: 'Missed Call',
      message: 'You have a missed call from +1 (555) 123-4567',
      time: '2 minutes ago',
      unread: true,
    },
    {
      id: 2,
      type: 'sms',
      title: 'New Message',
      message: 'SMS received from customer inquiry',
      time: '5 minutes ago',
      unread: true,
    },
    {
      id: 3,
      type: 'system',
      title: 'System Update',
      message: 'Your virtual number configuration has been updated',
      time: '1 hour ago',
      unread: false,
    },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4 text-voxlink-blue" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4 text-link-teal" />;
      default:
        return <Activity className="w-4 h-4 text-charcoal" />;
    }
  };

  return (
    <header className="bg-corporate-gray shadow-sm border-b border-corporate-hover">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-corporate-hover transition-colors"
            >
              <Menu className="w-5 h-5 text-corporate-text-secondary hover:text-corporate-text" />
            </button>

            {/* Search */}
            <div className="hidden md:block ml-4 lg:ml-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-corporate-text-secondary" />
                </div>
                <input
                  type="text"
                  placeholder="Search numbers, calls, messages..."
                  className="bg-corporate-hover border-corporate-active text-corporate-text placeholder-corporate-text-secondary pl-10 pr-4 py-2 w-64 lg:w-80 rounded-lg focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent transition-colors duration-200"
                />
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Mobile search button */}
            <button className="md:hidden p-2 rounded-lg hover:bg-corporate-hover transition-colors">
              <Search className="w-5 h-5 text-corporate-text-secondary hover:text-corporate-text" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-corporate-hover transition-colors relative"
              >
                <Bell className="w-5 h-5 text-corporate-text-secondary hover:text-corporate-text" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-red text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-charcoal">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto scrollbar-thin">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          notification.unread ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-charcoal">
                              {notification.title}
                            </p>
                            <p className="text-sm text-slate mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate mt-2">
                              {notification.time}
                            </p>
                          </div>
                          {notification.unread && (
                            <div className="w-2 h-2 bg-voxlink-blue rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-gray-200">
                    <button className="text-sm text-voxlink-blue hover:text-blue-700 font-medium">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-corporate-hover transition-colors"
              >
                <div className="w-8 h-8 bg-voxlink-blue rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-corporate-header font-medium text-corporate-text">
                    {user?.name || 'John Doe'}
                  </p>
                  <p className="text-corporate-small text-corporate-text-secondary">
                    {user?.email || 'john@company.com'}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-corporate-text-secondary" />
              </button>

              {/* User dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-corporate-gray rounded-lg shadow-lg border border-corporate-hover z-50">
                  <div className="py-1">
                    <button className="flex items-center w-full px-4 py-2 text-corporate-body text-corporate-text hover:bg-corporate-hover transition-colors">
                      <User className="w-4 h-4 mr-3" />
                      Profile
                    </button>
                    <button className="flex items-center w-full px-4 py-2 text-corporate-body text-corporate-text hover:bg-corporate-hover transition-colors">
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </button>
                    <hr className="my-1 border-corporate-hover" />
                    <button
                      onClick={logout}
                      className="flex items-center w-full px-4 py-2 text-corporate-body text-error-red hover:bg-corporate-hover transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;