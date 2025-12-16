import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

const Breadcrumb: React.FC = () => {
  const location = useLocation();

  const getBreadcrumbItems = (pathname: string): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/dashboard' }
    ];

    // Parse the pathname to create breadcrumb items
    const pathSegments = pathname.split('/').filter(segment => segment !== '');
    
    if (pathSegments.length === 0 || pathSegments[0] === 'dashboard') {
      return [{ label: 'Dashboard', isActive: true }];
    }

    // Map path segments to readable labels
    const segmentLabels: Record<string, string> = {
      'ai-agents': 'AI Voice Agent',
      'workflows': 'Voice Workflows',
      'inbox': 'Inbox',
      'sms-chats': 'SMS/Chats',
      'channels': 'Channels',
      'templates': 'Templates',
      'workflow-builder': 'Workflow Builder',
      'ai-hub': 'AI Hub',
      'campaigns': 'Campaigns',
      'reports': 'Reports',
      'call-status': 'Call Status Report',
      'abandon-rate': 'Abandon Rate Report',
      'outgoing-calls': 'Outgoing Call Report',
      'user-status': 'User Status Report',
      'calls': 'Call Report',
      'call-disposition': 'Call Disposition Report',
      'leaderboard': 'Leader Board',
      'sms-mms': 'SMS/MMS Report',
      'numbers': 'Numbers',
      'did-groups': 'DID Groups',
      'dialer': 'Auto Dialer',
      'power': 'Power Dialer',
      'parallel': 'Parallel Dialer',
      'speed': 'Speed Dial',
      'settings': 'Settings'
    };

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = segmentLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      const isLast = index === pathSegments.length - 1;
      
      items.push({
        label,
        href: isLast ? undefined : currentPath,
        isActive: isLast
      });
    });

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems(location.pathname);

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <Home className="w-4 h-4" />
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
          {item.href && !item.isActive ? (
            <Link
              to={item.href}
              className="hover:text-voxlink-blue transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={item.isActive ? 'text-voxlink-blue font-medium' : ''}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;