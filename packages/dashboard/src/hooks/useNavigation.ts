import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSafeLocalStorage } from '../utils/storage';

export interface NavigationState {
  expandedItems: string[];
  isCollapsed: boolean;
  activeSection: string | null;
}

export function useNavigation() {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useSafeLocalStorage('sidebar-collapsed', false);

  // Determine active section based on current path
  const getActiveSection = (pathname: string): string | null => {
    if (pathname.startsWith('/ai-agents')) return 'AI Voice Agent';
    if (pathname.startsWith('/inbox')) return 'Inbox';
    if (pathname.startsWith('/reports')) return 'Reports';
    if (pathname.startsWith('/numbers')) return 'Numbers';
    if (pathname.startsWith('/dialer')) return 'Auto Dialer';
    if (pathname === '/dashboard' || pathname === '/') return 'Dashboard';
    return null;
  };

  const activeSection = getActiveSection(location.pathname);

  // Auto-expand parent items based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const shouldExpand: string[] = [];

    // Define navigation structure for auto-expansion
    const navigationSections = [
      {
        name: 'AI Voice Agent',
        paths: ['/ai-agents']
      },
      {
        name: 'Inbox',
        paths: ['/inbox']
      },
      {
        name: 'Reports',
        paths: ['/reports']
      },
      {
        name: 'Numbers',
        paths: ['/numbers']
      },
      {
        name: 'Auto Dialer',
        paths: ['/dialer']
      }
    ];

    navigationSections.forEach(section => {
      const hasActiveChild = section.paths.some(path => 
        currentPath.startsWith(path)
      );
      if (hasActiveChild) {
        shouldExpand.push(section.name);
      }
    });

    setExpandedItems(prev => {
      const newExpanded = [...new Set([...prev, ...shouldExpand])];
      return newExpanded;
    });
  }, [location.pathname]);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  const expandItem = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) ? prev : [...prev, itemName]
    );
  };

  const collapseItem = (itemName: string) => {
    setExpandedItems(prev => prev.filter(name => name !== itemName));
  };

  const collapseAll = () => {
    setExpandedItems([]);
  };

  const expandAll = () => {
    const allSections = ['AI Voice Agent', 'Inbox', 'Reports', 'Numbers', 'Auto Dialer'];
    setExpandedItems(allSections);
  };

  return {
    expandedItems,
    isCollapsed,
    activeSection,
    toggleExpanded,
    toggleCollapsed,
    expandItem,
    collapseItem,
    collapseAll,
    expandAll
  };
}