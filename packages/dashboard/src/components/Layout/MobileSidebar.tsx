import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Bot, 
  Inbox, 
  Phone, 
  BarChart3, 
  Headphones,
  Settings,
  X
} from 'lucide-react';
import VoxLinkLogo from '../Logo/VoxLinkLogo';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const quickNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'AI Agents', href: '/ai-agents', icon: Bot },
  { name: 'Inbox', href: '/inbox/sms-chats', icon: Inbox },
  { name: 'Reports', href: '/reports/call-status', icon: BarChart3 },
  { name: 'Numbers', href: '/numbers', icon: Phone },
  { name: 'Dialer', href: '/dialer/power', icon: Headphones },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-corporate-gray transform shadow-xl ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-voxlink-blue to-link-teal">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <VoxLinkLogo className="text-white" size="md" />
              </div>
              <span className="ml-3 text-xl font-bold text-white">VoxLink</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Quick Navigation */}
          <div className="flex-1 px-4 py-6">
            <div className="space-y-2">
              {quickNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) => `
                      flex items-center px-4 py-3 text-corporate-nav-primary font-medium rounded-lg transition-all duration-200
                      ${isActive 
                        ? 'bg-gradient-to-r from-voxlink-blue to-link-teal text-white shadow-md' 
                        : 'text-corporate-text-secondary hover:bg-corporate-hover hover:text-corporate-text'
                      }
                    `}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-corporate-hover">
            <div className="text-xs text-corporate-text-secondary text-center">
              VoxLink Dashboard v1.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;