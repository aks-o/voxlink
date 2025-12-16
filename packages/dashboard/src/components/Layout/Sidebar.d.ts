import React from 'react';
interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}
declare const Sidebar: React.FC<SidebarProps>;
export default Sidebar;
