import React from 'react';
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
type NavigationAction = {
    type: 'TOGGLE_EXPANDED';
    payload: string;
} | {
    type: 'SET_EXPANDED';
    payload: string[];
} | {
    type: 'TOGGLE_COLLAPSED';
} | {
    type: 'SET_COLLAPSED';
    payload: boolean;
} | {
    type: 'SET_ACTIVE_SECTION';
    payload: string | null;
} | {
    type: 'TOGGLE_MOBILE_SIDEBAR';
} | {
    type: 'SET_MOBILE_SIDEBAR';
    payload: boolean;
} | {
    type: 'SET_BREADCRUMBS';
    payload: BreadcrumbItem[];
};
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
export declare const NavigationProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useNavigationContext: () => NavigationContextType;
export {};
