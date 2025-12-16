import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Bot, 
  Inbox, 
  Phone, 
  Users, 
  Zap, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  PhoneCall,
  Brain,
  Settings,
  X,
  ChevronDown,
  ChevronRight,
  Workflow,
  MessageCircle,
  Hash,
  FileType,
  Megaphone,
  TrendingUp,
  UserCheck,
  PhoneIncoming,
  PhoneOutgoing,
  Trophy,
  Menu,
  Activity,
  Target,
  Headphones,
  Clock,
  AlertCircle,
  BarChart2
} from 'lucide-react';
import { useResponsive } from '../../hooks/useResponsive';
import { useNavigation } from '../../hooks/useNavigation';
import VoxLinkLogo from '../Logo/VoxLinkLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  name: string;
  href?: string;
  icon: any;
  children?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { 
    name: 'AI Voice Agent', 
    icon: Bot,
    children: [
      { name: 'AI Agents', href: '/ai-agents', icon: Bot },
      { name: 'Voice Workflows', href: '/ai-agents/workflows', icon: Workflow },
      { name: 'Numbers', href: '/ai-agents/numbers', icon: Phone },
      { name: 'Call Logs', href: '/ai-agents/call-logs', icon: FileText },
      { name: 'Integrations', href: '/ai-agents/integrations', icon: Zap }
    ]
  },
  { 
    name: 'Inbox', 
    icon: Inbox,
    children: [
      { name: 'SMS/Chats', href: '/inbox/sms-chats', icon: MessageCircle },
      { name: 'Channels', href: '/inbox/channels', icon: Hash },
      { name: 'Templates', href: '/inbox/templates', icon: FileType },
      { name: 'Workflow Builder', href: '/inbox/workflow-builder', icon: Workflow },
      { name: 'AI Hub', href: '/inbox/ai-hub', icon: Brain },
      { name: 'Campaigns', href: '/inbox/campaigns', icon: Megaphone }
    ]
  },
  { 
    name: 'Reports', 
    icon: BarChart3,
    children: [
      { name: 'Call Status Report', href: '/reports/call-status', icon: Activity },
      { name: 'Abandon Rate Report', href: '/reports/abandon-rate', icon: AlertCircle },
      { name: 'Outgoing Call Report', href: '/reports/outgoing-calls', icon: PhoneOutgoing },
      { name: 'User Status Report', href: '/reports/user-status', icon: UserCheck },
      { name: 'Call Report', href: '/reports/calls', icon: PhoneCall },
      { name: 'Call Disposition Report', href: '/reports/call-disposition', icon: Target },
      { name: 'Leader Board', href: '/reports/leaderboard', icon: Trophy },
      { name: 'SMS/MMS Report', href: '/reports/sms-mms', icon: MessageSquare }
    ]
  },
  { 
    name: 'Numbers', 
    icon: Phone,
    children: [
      { name: 'Numbers', href: '/numbers', icon: Phone },
      { name: 'DID Groups', href: '/numbers/did-groups', icon: Users }
    ]
  },
  { 
    name: 'Auto Dialer', 
    icon: Headphones,
    children: [
      { name: 'Power Dialer', href: '/dialer/power', icon: Zap },
      { name: 'Parallel Dialer', href: '/dialer/parallel', icon: Users },
      { name: 'Speed Dial', href: '/dialer/speed', icon: Clock }
    ]
  }
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { isMobile, isTablet } = useResponsive();
  const { 
    expandedItems, 
    isCollapsed, 
    activeSection, 
    toggleExpanded, 
    toggleCollapsed 
  } = useNavigation();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile && isOpen) {
      onClose();
    }
  }, [location.pathname, isMobile, isOpen, onClose]);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const isParentActive = (item: NavigationItem) => {
    if (item.href) {
      return isActive(item.href);
    }
    return item.children?.some(child => child.href && isActive(child.href)) || false;
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.name);
    const itemIsActive = item.href ? isActive(item.href) : isParentActive(item);

    if (hasChildren) {
      return (
        <div key={item.name} className="relative">
          <button
            onClick={() => toggleExpanded(item.name)}
            className={`w-full flex items-center justify-between px-3 py-2.5 text-corporate-nav-primary font-medium rounded-lg transition-all duration-200 group ${
              itemIsActive 
                ? 'bg-gradient-to-r from-voxlink-blue to-link-teal text-white shadow-md' 
                : 'text-corporate-text-secondary hover:bg-corporate-hover hover:text-corporate-text'
            } ${isCollapsed ? 'justify-center px-2' : ''}`}
            title={isCollapsed ? item.name : undefined}
          >
            <div className="flex items-center min-w-0">
              <Icon className={`flex-shrink-0 transition-colors ${
                itemIsActive ? 'text-white' : 'text-corporate-text-secondary group-hover:text-corporate-text'
              } ${isCollapsed ? 'h-5 w-5' : 'mr-3 h-5 w-5'}`} />
              {!isCollapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </div>
            {!isCollapsed && (
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              } ${itemIsActive ? 'text-white' : 'text-corporate-text-secondary'}`} />
            )}
          </button>
          
          {isExpanded && !isCollapsed && (
            <div className="mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
              <div className="ml-4 border-l-2 border-corporate-hover pl-4 space-y-1">
                {item.children?.map(child => renderNavigationItem(child, level + 1))}
              </div>
            </div>
          )}
          
          {/* Tooltip for collapsed state */}
          {isCollapsed && hasChildren && (
            <div className="absolute left-full top-0 ml-2 px-3 py-2 bg-corporate-active text-corporate-text text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              {item.name}
              <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-corporate-active rotate-45"></div>
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.name}
        to={item.href!}
        onClick={isMobile ? onClose : undefined}
        className={({ isActive: linkIsActive }) => `
          group flex items-center px-3 py-2 font-medium rounded-lg transition-all duration-200 relative
          ${linkIsActive || isActive(item.href!) 
            ? 'bg-gradient-to-r from-voxlink-blue to-link-teal text-white shadow-md' 
            : 'text-corporate-text-secondary hover:bg-corporate-hover hover:text-corporate-text'
          }
          ${level > 0 ? 'text-corporate-nav-secondary' : 'text-corporate-nav-primary'}
          ${isCollapsed ? 'justify-center px-2' : ''}
        `}
        title={isCollapsed ? item.name : undefined}
      >
        <Icon className={`flex-shrink-0 transition-colors ${
          isActive(item.href!) ? 'text-white' : 'text-corporate-text-secondary group-hover:text-corporate-text'
        } ${isCollapsed ? 'h-5 w-5' : level > 0 ? 'mr-3 h-4 w-4' : 'mr-3 h-5 w-5'}`} />
        
        {!isCollapsed && (
          <span className="truncate">{item.name}</span>
        )}
        
        {/* Active indicator */}
        {isActive(item.href!) && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l-full"></div>
        )}
        
        {/* Tooltip for collapsed state */}
        {isCollapsed && (
          <div className="absolute left-full top-0 ml-2 px-3 py-2 bg-corporate-active text-corporate-text text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
            {item.name}
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-corporate-active rotate-45"></div>
          </div>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 transition-all duration-300 ${
        isCollapsed ? 'lg:w-16' : 'lg:w-64'
      }`}>
        <div className="flex flex-col flex-grow bg-corporate-gray border-r border-corporate-hover shadow-sm">
          {/* Logo and collapse button */}
          <div className={`flex items-center flex-shrink-0 p-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-voxlink-blue to-link-teal rounded-lg flex items-center justify-center shadow-md">
                <VoxLinkLogo className="text-white" size="md" />
              </div>
              {!isCollapsed && (
                <span className="ml-3 text-xl font-bold text-corporate-text">
                  VoxLink
                </span>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={toggleCollapsed}
                className="p-1.5 rounded-lg hover:bg-corporate-hover transition-colors"
                title="Collapse sidebar"
              >
                <Menu className="w-4 h-4 text-corporate-text-secondary hover:text-corporate-text" />
              </button>
            )}
          </div>

          {/* Expand button for collapsed state */}
          {isCollapsed && (
            <div className="flex justify-center px-2 pb-2">
              <button
                onClick={toggleCollapsed}
                className="p-2 rounded-lg hover:bg-corporate-hover transition-colors"
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4 text-corporate-text-secondary hover:text-corporate-text" />
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className={`flex-1 px-2 space-y-1 overflow-y-auto scrollbar-thin ${isCollapsed ? 'py-2' : 'py-4'}`}>
            {navigation.map((item) => renderNavigationItem(item))}
          </nav>

          {/* Settings at bottom */}
          <div className="flex-shrink-0 p-2 border-t border-corporate-hover">
            <NavLink
              to="/settings"
              className={({ isActive: linkIsActive }) => `
                group flex items-center px-3 py-2.5 text-corporate-nav-primary font-medium rounded-lg transition-all duration-200 relative
                ${linkIsActive || isActive('/settings')
                  ? 'bg-gradient-to-r from-voxlink-blue to-link-teal text-white shadow-md' 
                  : 'text-corporate-text-secondary hover:bg-corporate-hover hover:text-corporate-text'
                }
                ${isCollapsed ? 'justify-center px-2' : ''}
              `}
              title={isCollapsed ? 'Settings' : undefined}
            >
              <Settings className={`flex-shrink-0 transition-colors ${
                isActive('/settings') ? 'text-white' : 'text-corporate-text-secondary group-hover:text-corporate-text'
              } ${isCollapsed ? 'h-5 w-5' : 'mr-3 h-5 w-5'}`} />
              
              {!isCollapsed && (
                <span className="truncate">Settings</span>
              )}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full top-0 ml-2 px-3 py-2 bg-corporate-active text-corporate-text text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  Settings
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-corporate-active rotate-45"></div>
                </div>
              )}
            </NavLink>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-corporate-gray transform shadow-xl ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-voxlink-blue to-link-teal">
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

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
            {navigation.map((item) => renderNavigationItem(item))}
          </nav>

          {/* Settings at bottom */}
          <div className="flex-shrink-0 p-3 border-t border-corporate-hover">
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive: linkIsActive }) => `
                group flex items-center px-3 py-2.5 text-corporate-nav-primary font-medium rounded-lg transition-all duration-200
                ${linkIsActive || isActive('/settings')
                  ? 'bg-gradient-to-r from-voxlink-blue to-link-teal text-white shadow-md' 
                  : 'text-corporate-text-secondary hover:bg-corporate-hover hover:text-corporate-text'
                }
              `}
            >
              <Settings className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                isActive('/settings') ? 'text-white' : 'text-corporate-text-secondary group-hover:text-corporate-text'
              }`} />
              <span className="truncate">Settings</span>
            </NavLink>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;