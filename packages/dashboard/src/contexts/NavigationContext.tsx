import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { safeStorage } from '../utils/storage';

interface NavigationState {
  expandedItems: string[];
  isCollapsed: boolean;
  activeSection: string | null;
  isMobileSidebarOpen: boolean;
  breadcrumbs: BreadcrumbItem[];
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

type NavigationAction =
  | { type: 'TOGGLE_EXPANDED'; payload: string }
  | { type: 'SET_EXPANDED'; payload: string[] }
  | { type: 'TOGGLE_COLLAPSED' }
  | { type: 'SET_COLLAPSED'; payload: boolean }
  | { type: 'SET_ACTIVE_SECTION'; payload: string | null }
  | { type: 'TOGGLE_MOBILE_SIDEBAR' }
  | { type: 'SET_MOBILE_SIDEBAR'; payload: boolean }
  | { type: 'SET_BREADCRUMBS'; payload: BreadcrumbItem[] };

interface NavigationContextType {
  state: NavigationState;
  dispatch: React.Dispatch<NavigationAction>;
  toggleExpanded: (itemName: string) => void;
  toggleCollapsed: () => void;
  toggleMobileSidebar: () => void;
  setMobileSidebar: (isOpen: boolean) => void;
  expandItem: (itemName: string) => void;
  collapseItem: (itemName: string) => void;
  collapseAll: () => void;
  expandAll: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const initialState: NavigationState = {
  expandedItems: [],
  isCollapsed: false,
  activeSection: null,
  isMobileSidebarOpen: false,
  breadcrumbs: []
};

function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case 'TOGGLE_EXPANDED':
      return {
        ...state,
        expandedItems: state.expandedItems.includes(action.payload)
          ? state.expandedItems.filter(item => item !== action.payload)
          : [...state.expandedItems, action.payload]
      };
    
    case 'SET_EXPANDED':
      return {
        ...state,
        expandedItems: action.payload
      };
    
    case 'TOGGLE_COLLAPSED':
      return {
        ...state,
        isCollapsed: !state.isCollapsed
      };
    
    case 'SET_COLLAPSED':
      return {
        ...state,
        isCollapsed: action.payload
      };
    
    case 'SET_ACTIVE_SECTION':
      return {
        ...state,
        activeSection: action.payload
      };
    
    case 'TOGGLE_MOBILE_SIDEBAR':
      return {
        ...state,
        isMobileSidebarOpen: !state.isMobileSidebarOpen
      };
    
    case 'SET_MOBILE_SIDEBAR':
      return {
        ...state,
        isMobileSidebarOpen: action.payload
      };
    
    case 'SET_BREADCRUMBS':
      return {
        ...state,
        breadcrumbs: action.payload
      };
    
    default:
      return state;
  }
}

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(navigationReducer, {
    ...initialState,
    isCollapsed: (() => {
      try {
        const saved = safeStorage.getItem('sidebar-collapsed');
        return saved ? JSON.parse(saved) : false;
      } catch (e) {
        return false;
      }
    })()
  });
  const location = useLocation();

  // Save collapsed state to localStorage
  useEffect(() => {
    safeStorage.setItem('sidebar-collapsed', JSON.stringify(state.isCollapsed));
  }, [state.isCollapsed]);

  // Update active section and breadcrumbs based on current path
  useEffect(() => {
    const pathname = location.pathname;
    
    // Determine active section
    let activeSection: string | null = null;
    if (pathname.startsWith('/ai-agents')) activeSection = 'AI Voice Agent';
    else if (pathname.startsWith('/inbox')) activeSection = 'Inbox';
    else if (pathname.startsWith('/reports')) activeSection = 'Reports';
    else if (pathname.startsWith('/numbers')) activeSection = 'Numbers';
    else if (pathname.startsWith('/dialer')) activeSection = 'Auto Dialer';
    else if (pathname === '/dashboard' || pathname === '/') activeSection = 'Dashboard';

    dispatch({ type: 'SET_ACTIVE_SECTION', payload: activeSection });

    // Auto-expand parent items
    const shouldExpand: string[] = [];
    const navigationSections = [
      { name: 'AI Voice Agent', paths: ['/ai-agents'] },
      { name: 'Inbox', paths: ['/inbox'] },
      { name: 'Reports', paths: ['/reports'] },
      { name: 'Numbers', paths: ['/numbers'] },
      { name: 'Auto Dialer', paths: ['/dialer'] }
    ];

    navigationSections.forEach(section => {
      const hasActiveChild = section.paths.some(path => pathname.startsWith(path));
      if (hasActiveChild) {
        shouldExpand.push(section.name);
      }
    });

    if (shouldExpand.length > 0) {
      const newExpanded = [...new Set([...state.expandedItems, ...shouldExpand])];
      dispatch({ type: 'SET_EXPANDED', payload: newExpanded });
    }

    // Generate breadcrumbs
    const breadcrumbs = generateBreadcrumbs(pathname);
    dispatch({ type: 'SET_BREADCRUMBS', payload: breadcrumbs });

    // Close mobile sidebar on route change
    if (state.isMobileSidebarOpen) {
      dispatch({ type: 'SET_MOBILE_SIDEBAR', payload: false });
    }
  }, [location.pathname, state.expandedItems, state.isMobileSidebarOpen]);

  const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/dashboard' }
    ];

    const pathSegments = pathname.split('/').filter(segment => segment !== '');
    
    if (pathSegments.length === 0 || pathSegments[0] === 'dashboard') {
      return [{ label: 'Dashboard', isActive: true }];
    }

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

  const toggleExpanded = (itemName: string) => {
    dispatch({ type: 'TOGGLE_EXPANDED', payload: itemName });
  };

  const toggleCollapsed = () => {
    dispatch({ type: 'TOGGLE_COLLAPSED' });
  };

  const toggleMobileSidebar = () => {
    dispatch({ type: 'TOGGLE_MOBILE_SIDEBAR' });
  };

  const setMobileSidebar = (isOpen: boolean) => {
    dispatch({ type: 'SET_MOBILE_SIDEBAR', payload: isOpen });
  };

  const expandItem = (itemName: string) => {
    if (!state.expandedItems.includes(itemName)) {
      dispatch({ type: 'SET_EXPANDED', payload: [...state.expandedItems, itemName] });
    }
  };

  const collapseItem = (itemName: string) => {
    dispatch({ type: 'SET_EXPANDED', payload: state.expandedItems.filter(item => item !== itemName) });
  };

  const collapseAll = () => {
    dispatch({ type: 'SET_EXPANDED', payload: [] });
  };

  const expandAll = () => {
    const allSections = ['AI Voice Agent', 'Inbox', 'Reports', 'Numbers', 'Auto Dialer'];
    dispatch({ type: 'SET_EXPANDED', payload: allSections });
  };

  const value: NavigationContextType = {
    state,
    dispatch,
    toggleExpanded,
    toggleCollapsed,
    toggleMobileSidebar,
    setMobileSidebar,
    expandItem,
    collapseItem,
    collapseAll,
    expandAll
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigationContext must be used within a NavigationProvider');
  }
  return context;
};