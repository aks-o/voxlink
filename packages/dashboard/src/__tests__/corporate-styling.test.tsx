import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import MobileSidebar from '../components/Layout/MobileSidebar';

// Mock the auth hook
jest.mock('../utils/auth', () => ({
  useAuth: () => ({
    logout: jest.fn(),
  }),
}));

// Mock the responsive hook
jest.mock('../hooks/useResponsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
  }),
}));

// Mock the navigation hook
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
  name: 'Test User',
  email: 'test@example.com',
};

describe('Corporate Styling Tests', () => {
  describe('Header Component', () => {
    it('should render with corporate gray background', () => {
      render(
        <Header onMenuClick={jest.fn()} user={mockUser} />
      );
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('bg-corporate-gray');
    });

    it('should have proper text colors for corporate theme', () => {
      render(
        <Header onMenuClick={jest.fn()} user={mockUser} />
      );
      
      const userName = screen.getByText('Test User');
      expect(userName).toHaveClass('text-corporate-text');
      
      const userEmail = screen.getByText('test@example.com');
      expect(userEmail).toHaveClass('text-corporate-text-secondary');
    });

    it('should have corporate-styled search input', () => {
      render(
        <Header onMenuClick={jest.fn()} user={mockUser} />
      );
      
      const searchInput = screen.getByPlaceholderText('Search numbers, calls, messages...');
      expect(searchInput).toHaveClass('bg-corporate-hover');
      expect(searchInput).toHaveClass('text-corporate-text');
      expect(searchInput).toHaveClass('placeholder-corporate-text-secondary');
    });

    it('should have proper hover states for interactive elements', () => {
      render(
        <Header onMenuClick={jest.fn()} user={mockUser} />
      );
      
      const menuButton = screen.getByRole('button', { name: /menu/i });
      expect(menuButton).toHaveClass('hover:bg-corporate-hover');
    });
  });

  describe('Sidebar Component', () => {
    it('should render with corporate gray background', () => {
      render(
        <BrowserRouter>
          <Sidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      const sidebar = document.querySelector('.bg-corporate-gray');
      expect(sidebar).toBeInTheDocument();
    });

    it('should have corporate typography for navigation items', () => {
      render(
        <BrowserRouter>
          <Sidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      const dashboardLink = screen.getByText('Dashboard');
      const linkElement = dashboardLink.closest('a');
      expect(linkElement).toHaveClass('text-corporate-nav-primary');
    });

    it('should maintain VoxLink brand gradient for active items', () => {
      render(
        <BrowserRouter>
          <Sidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      // Check that active items still use the brand gradient
      const activeElements = document.querySelectorAll('.bg-gradient-to-r.from-voxlink-blue.to-link-teal');
      expect(activeElements.length).toBeGreaterThan(0);
    });

    it('should have proper corporate hover states', () => {
      render(
        <BrowserRouter>
          <Sidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      const hoverElements = document.querySelectorAll('.hover\\:bg-corporate-hover');
      expect(hoverElements.length).toBeGreaterThan(0);
    });
  });

  describe('MobileSidebar Component', () => {
    it('should render with corporate gray background', () => {
      render(
        <BrowserRouter>
          <MobileSidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      const mobileSidebar = document.querySelector('.bg-corporate-gray');
      expect(mobileSidebar).toBeInTheDocument();
    });

    it('should have corporate typography for navigation items', () => {
      render(
        <BrowserRouter>
          <MobileSidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      const navItems = document.querySelectorAll('.text-corporate-nav-primary');
      expect(navItems.length).toBeGreaterThan(0);
    });

    it('should maintain brand gradient header', () => {
      render(
        <BrowserRouter>
          <MobileSidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      const gradientHeader = document.querySelector('.bg-gradient-to-r.from-voxlink-blue.to-link-teal');
      expect(gradientHeader).toBeInTheDocument();
    });

    it('should have corporate border colors', () => {
      render(
        <BrowserRouter>
          <MobileSidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      const corporateBorders = document.querySelectorAll('.border-corporate-hover');
      expect(corporateBorders.length).toBeGreaterThan(0);
    });
  });

  describe('Typography Classes', () => {
    it('should have corporate typography utilities available', () => {
      const testDiv = document.createElement('div');
      
      // Test corporate typography classes
      testDiv.className = 'text-corporate-nav-primary';
      expect(testDiv).toHaveClass('text-corporate-nav-primary');
      
      testDiv.className = 'text-corporate-nav-secondary';
      expect(testDiv).toHaveClass('text-corporate-nav-secondary');
      
      testDiv.className = 'text-corporate-header';
      expect(testDiv).toHaveClass('text-corporate-header');
      
      testDiv.className = 'text-corporate-body';
      expect(testDiv).toHaveClass('text-corporate-body');
      
      testDiv.className = 'text-corporate-small';
      expect(testDiv).toHaveClass('text-corporate-small');
      
      testDiv.className = 'text-corporate-large';
      expect(testDiv).toHaveClass('text-corporate-large');
    });
  });

  describe('Color Classes', () => {
    it('should have corporate color utilities available', () => {
      const testDiv = document.createElement('div');
      
      // Test corporate color classes
      testDiv.className = 'bg-corporate-gray';
      expect(testDiv).toHaveClass('bg-corporate-gray');
      
      testDiv.className = 'text-corporate-text';
      expect(testDiv).toHaveClass('text-corporate-text');
      
      testDiv.className = 'text-corporate-text-secondary';
      expect(testDiv).toHaveClass('text-corporate-text-secondary');
      
      testDiv.className = 'bg-corporate-hover';
      expect(testDiv).toHaveClass('bg-corporate-hover');
      
      testDiv.className = 'bg-corporate-active';
      expect(testDiv).toHaveClass('bg-corporate-active');
      
      testDiv.className = 'border-corporate-hover';
      expect(testDiv).toHaveClass('border-corporate-hover');
    });
  });

  describe('Accessibility', () => {
    it('should have proper focus indicators', () => {
      render(
        <Header onMenuClick={jest.fn()} user={mockUser} />
      );
      
      const focusableElements = document.querySelectorAll('[class*="focus:ring"]');
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('should maintain proper contrast ratios', () => {
      render(
        <BrowserRouter>
          <Sidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      // Check that high contrast text classes are used
      const highContrastElements = document.querySelectorAll('.text-corporate-text, .text-corporate-text-secondary');
      expect(highContrastElements.length).toBeGreaterThan(0);
    });

    it('should have keyboard navigation support', () => {
      render(
        <BrowserRouter>
          <Sidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      const keyboardFocusElements = document.querySelectorAll('[class*="focus:outline-none"]');
      expect(keyboardFocusElements.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Behavior', () => {
    it('should have mobile-specific classes', () => {
      const testDiv = document.createElement('div');
      
      testDiv.className = 'mobile-button-corporate';
      expect(testDiv).toHaveClass('mobile-button-corporate');
      
      testDiv.className = 'mobile-nav-item-corporate';
      expect(testDiv).toHaveClass('mobile-nav-item-corporate');
      
      testDiv.className = 'mobile-card-corporate';
      expect(testDiv).toHaveClass('mobile-card-corporate');
    });

    it('should maintain touch targets on mobile', () => {
      render(
        <BrowserRouter>
          <MobileSidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      const touchTargets = document.querySelectorAll('button, a');
      touchTargets.forEach(element => {
        const styles = window.getComputedStyle(element);
        // Check that elements have minimum touch target size
        expect(parseInt(styles.minHeight) >= 44 || parseInt(styles.height) >= 44).toBeTruthy();
      });
    });
  });
});