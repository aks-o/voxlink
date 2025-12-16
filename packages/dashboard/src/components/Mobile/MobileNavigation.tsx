import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Phone, 
  BarChart3, 
  Settings,
  Menu,
  X,
  ChevronRight,
  Inbox,
  Users,
  Bot
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useResponsive';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: Home 
  },
  { 
    name: 'Numbers', 
    href: '/numbers', 
    icon: Phone,
    children: [
      { name: 'Search Numbers', href: '/numbers/search', icon: Phone },
      { name: 'My Numbers', href: '/numbers/inventory', icon: Phone },
      { name: 'Configuration', href: '/numbers/configure', icon: Settings },
    ]
  },
  { 
    name: 'Inbox', 
    href: '/inbox', 
    icon: Inbox,
    badge: 3
  },
  { 
    name: 'AI Agent', 
    href: '/ai-voice-agent', 
    icon: Bot 
  },
  { 
    name: 'Analytics', 
    href: '/analytics', 
    icon: BarChart3 
  },
  { 
    name: 'Users', 
    href: '/users', 
    icon: Users 
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: Settings 
  },
];

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ isOpen, onClose }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const isMobile = useIsMobile();

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  const isExpanded = (itemName: string) => expandedItems.includes(itemName);

  const handleNavClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Navigation Panel */}
      <div 
        className={`
          fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-50 
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          shadow-xl
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-voxlink-blue to-link-teal rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="ml-3 text-xl font-bold text-gradient">VoxLink</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-2">
            {navigationItems.map((item) => (
              <div key={item.name}>
                {/* Main Item */}
                <div className="flex items-center">
                  <NavLink
                    to={item.href}
                    onClick={handleNavClick}
                    className={`
                      flex-1 flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors
                      ${isActive(item.href) 
                        ? 'bg-voxlink-blue text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                      touch-manipulation
                    `}
                  >
                    <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                  
                  {/* Expand Button for items with children */}
                  {item.children && (
                    <button
                      onClick={() => toggleExpanded(item.name)}
                      className="p-2 ml-1 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
                      aria-label={`${isExpanded(item.name) ? 'Collapse' : 'Expand'} ${item.name}`}
                    >
                      <ChevronRight 
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                          isExpanded(item.name) ? 'rotate-90' : ''
                        }`} 
                      />
                    </button>
                  )}
                </div>

                {/* Sub Items */}
                {item.children && isExpanded(item.name) && (
                  <div className="ml-8 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.name}
                        to={child.href}
                        onClick={handleNavClick}
                        className={`
                          flex items-center px-3 py-2 rounded-lg text-sm transition-colors
                          ${isActive(child.href) 
                            ? 'bg-blue-50 text-voxlink-blue font-medium' 
                            : 'text-gray-600 hover:bg-gray-50'
                          }
                          touch-manipulation
                        `}
                      >
                        <child.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                        {child.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="text-xs text-gray-500 text-center">
            VoxLink Dashboard v1.0
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;