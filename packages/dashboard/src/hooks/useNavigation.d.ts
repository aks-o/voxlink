export interface NavigationState {
    expandedItems: string[];
    isCollapsed: boolean;
    activeSection: string | null;
}
export declare function useNavigation(): {
    expandedItems: string[];
    isCollapsed: boolean;
    activeSection: string | null;
    toggleExpanded: (itemName: string) => void;
    toggleCollapsed: () => void;
    expandItem: (itemName: string) => void;
    collapseItem: (itemName: string) => void;
    collapseAll: () => void;
    expandAll: () => void;
};
