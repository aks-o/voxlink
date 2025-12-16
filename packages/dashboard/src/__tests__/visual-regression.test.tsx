import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import MobileSidebar from '../components/Layout/MobileSidebar';

// Mock dependencies
jest.mock('../utils/auth', () => ({
  useAuth: () => ({
    logout: jest.fn(),
  }),
}));

jest.mock('../hooks/useResponsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
  }),
}));

jest.mock('../hooks/useNavigation', () => ({
  useNavigation: () => ({
    expandedItems: [],
    isCollapsed: false,
    activeSection: '',
    toggleExpanded: jest.fn(),
    toggleCollapsed: jest.fn(),
  }),
}));

const mockUser = {
  name: 'John Doe',
  email: 'john@company.com',
};

describe('Visual Regression Tests', () => {
  describe('Header Component Snapshots', () => {
    it('should match header snapshot with corporate styling', () => {
      const { container } = render(
        <Header onMenuClick={jest.fn()} user={mockUser} />
      );
      
      expect(container.firstChild).toMatchSnapshot('header-corporate-styling');
    });

    it('should match header snapshot with notifications open', () => {
      const { container, getByRole } = render(
        <Header onMenuClick={jest.fn()} user={mockUser} />
      );
      
      // Click notifications button to open dropdown
      const notificationButton = getByRole('button', { name: /notifications/i });
      notificationButton.click();
      
      expect(container.firstChild).toMatchSnapshot('header-notifications-open');
    });

    it('should match header snapshot with user menu open', () => {
      const { container, getByRole } = render(
        <Header onMenuClick={jest.fn()} user={mockUser} />
      );
      
      // Click user menu button to open dropdown
      const userMenuButton = getByRole('button', { name: /user menu/i });
      userMenuButton.click();
      
      expect(container.firstChild).toMatchSnapshot('header-user-menu-open');
    });
  });

  describe('Sidebar Component Snapshots', () => {
    it('should match sidebar snapshot with corporate styling', () => {
      const { container } = render(
        <BrowserRouter>
          <Sidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      expect(container.firstChild).toMatchSnapshot('sidebar-corporate-styling');
    });

    it('should match collapsed sidebar snapshot', () => {
      // Mock collapsed state
      jest.mocked(require('../hooks/useNavigation').useNavigation).mockReturnValue({
        expandedItems: [],
        isCollapsed: true,
        activeSection: '',
        toggleExpanded: jest.fn(),
        toggleCollapsed: jest.fn(),
      });

      const { container } = render(
        <BrowserRouter>
          <Sidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      expect(container.firstChild).toMatchSnapshot('sidebar-collapsed');
    });

    it('should match sidebar with expanded navigation', () => {
      // Mock expanded state
      jest.mocked(require('../hooks/useNavigation').useNavigation).mockReturnValue({
        expandedItems: ['AI Voice Agent', 'Inbox', 'Reports'],
        isCollapsed: false,
        activeSection: '',
        toggleExpanded: jest.fn(),
        toggleCollapsed: jest.fn(),
      });

      const { container } = render(
        <BrowserRouter>
          <Sidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      expect(container.firstChild).toMatchSnapshot('sidebar-expanded-navigation');
    });
  });

  describe('Mobile Sidebar Component Snapshots', () => {
    it('should match mobile sidebar snapshot with corporate styling', () => {
      const { container } = render(
        <BrowserRouter>
          <MobileSidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      expect(container.firstChild).toMatchSnapshot('mobile-sidebar-corporate-styling');
    });

    it('should match mobile sidebar closed state', () => {
      const { container } = render(
        <BrowserRouter>
          <MobileSidebar isOpen={false} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      expect(container.firstChild).toMatchSnapshot('mobile-sidebar-closed');
    });
  });

  describe('Responsive Breakpoint Tests', () => {
    beforeEach(() => {
      // Reset viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
    });

    it('should match desktop layout snapshot', () => {
      // Desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1440,
      });

      const { container } = render(
        <BrowserRouter>
          <div className="flex">
            <Sidebar isOpen={true} onClose={jest.fn()} />
            <div className="flex-1">
              <Header onMenuClick={jest.fn()} user={mockUser} />
            </div>
          </div>
        </BrowserRouter>
      );
      
      expect(container.firstChild).toMatchSnapshot('desktop-layout');
    });

    it('should match tablet layout snapshot', () => {
      // Tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      jest.mocked(require('../hooks/useResponsive').useResponsive).mockReturnValue({
        isMobile: false,
        isTablet: true,
      });

      const { container } = render(
        <BrowserRouter>
          <div className="flex">
            <Sidebar isOpen={true} onClose={jest.fn()} />
            <div className="flex-1">
              <Header onMenuClick={jest.fn()} user={mockUser} />
            </div>
          </div>
        </BrowserRouter>
      );
      
      expect(container.firstChild).toMatchSnapshot('tablet-layout');
    });

    it('should match mobile layout snapshot', () => {
      // Mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      jest.mocked(require('../hooks/useResponsive').useResponsive).mockReturnValue({
        isMobile: true,
        isTablet: false,
      });

      const { container } = render(
        <BrowserRouter>
          <div>
            <Header onMenuClick={jest.fn()} user={mockUser} />
            <MobileSidebar isOpen={true} onClose={jest.fn()} />
          </div>
        </BrowserRouter>
      );
      
      expect(container.firstChild).toMatchSnapshot('mobile-layout');
    });
  });

  describe('Theme Consistency Tests', () => {
    it('should have consistent corporate colors across components', () => {
      const headerContainer = render(
        <Header onMenuClick={jest.fn()} user={mockUser} />
      ).container;

      const sidebarContainer = render(
        <BrowserRouter>
          <Sidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      ).container;

      const mobileSidebarContainer = render(
        <BrowserRouter>
          <MobileSidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      ).container;

      // Check that all components use the same corporate gray background
      const headerBg = headerContainer.querySelector('.bg-corporate-gray');
      const sidebarBg = sidebarContainer.querySelector('.bg-corporate-gray');
      const mobileSidebarBg = mobileSidebarContainer.querySelector('.bg-corporate-gray');

      expect(headerBg).toBeInTheDocument();
      expect(sidebarBg).toBeInTheDocument();
      expect(mobileSidebarBg).toBeInTheDocument();
    });

    it('should maintain brand gradient consistency', () => {
      const sidebarContainer = render(
        <BrowserRouter>
          <Sidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      ).container;

      const mobileSidebarContainer = render(
        <BrowserRouter>
          <MobileSidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      ).container;

      // Check that brand gradients are consistent
      const sidebarGradient = sidebarContainer.querySelector('.from-voxlink-blue.to-link-teal');
      const mobileSidebarGradient = mobileSidebarContainer.querySelector('.from-voxlink-blue.to-link-teal');

      expect(sidebarGradient).toBeInTheDocument();
      expect(mobileSidebarGradient).toBeInTheDocument();
    });
  });
});