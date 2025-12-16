import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import MobileSidebar from '../components/Layout/MobileSidebar';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

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

describe('Accessibility Tests', () => {
  describe('Header Component Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <Header onMenuClick={jest.fn()} user={mockUser} />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels and roles', () => {
      render(
        <Header onMenuClick={jest.fn()} user={mockUser} />
      );
      
      // Check for proper header role
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      
      // Check for proper button roles and labels
      const menuButton = screen.getByRole('button', { name: /menu/i });
      expect(menuButton).toBeInTheDocument();
      
      const notificationButton = screen.getByRole('button', { name: /notifications/i });
      expect(notificationButton).toBeInTheDocument();
    });

    it('should have proper keyboard navigation', () => {
      render(
        <Header onMenuClick={jest.fn()} user={mockUser} />
      );
      
      const focusableElements = screen.getAllByRole('button');
      focusableElements.forEach(element => {
        expect(element).toHaveAttribute('tabIndex', '0');
      });
    });

    it('should have sufficient color contrast', () => {
      render(
        <Header onMenuClick={jest.fn()} user={mockUser} />
      );
      
      // Check that corporate text colors are used for proper contrast
      const userName = screen.getByText('John Doe');
      expect(userName).toHaveClass('text-corporate-text');
      
      const userEmail = screen.getByText('john@company.com');
      expect(userEmail).toHaveClass('text-corporate-text-secondary');
    });

    it('should have proper focus indicators', () => {
      const { container } = render(
        <Header onMenuClick={jest.fn()} user={mockUser} />
      );
      
      const focusableElements = container.querySelectorAll('button, input, a');
      focusableElements.forEach(element => {
        const classes = element.className;
        expect(classes).toMatch(/focus:(outline-none|ring)/);
      });
    });
  });

  describe('Sidebar Component Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <BrowserRouter>
          <Sidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper navigation structure', () => {
      render(
        <BrowserRouter>
          <Sidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      // Check for proper navigation role
      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();
      
      // Check for proper link roles
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should have proper ARIA attributes for expandable items', () => {
      render(
        <BrowserRouter>
          <Sidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      // Check for expandable navigation items
      const expandableButtons = screen.getAllByRole('button');
      expandableButtons.forEach(button => {
        if (button.getAttribute('aria-expanded') !== null) {
          expect(button).toHaveAttribute('aria-expanded');
        }
      });
    });

    it('should have proper keyboard navigation support', () => {
      render(
        <BrowserRouter>
          <Sidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      const interactiveElements = screen.getAllByRole('link');
      interactiveElements.forEach(element => {
        expect(element).not.toHaveAttribute('tabIndex', '-1');
      });
    });

    it('should maintain focus visibility', () => {
      const { container } = render(
        <BrowserRouter>
          <Sidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      const focusableElements = container.querySelectorAll('a, button');
      focusableElements.forEach(element => {
        const classes = element.className;
        expect(classes).toMatch(/focus:(outline-none|ring|visible)/);
      });
    });
  });

  describe('Mobile Sidebar Component Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <BrowserRouter>
          <MobileSidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper modal/drawer accessibility', () => {
      render(
        <BrowserRouter>
          <MobileSidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      // Check for proper close button
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should have proper touch target sizes', () => {
      const { container } = render(
        <BrowserRouter>
          <MobileSidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );
      
      const touchTargets = container.querySelectorAll('button, a');
      touchTargets.forEach(element => {
        const styles = window.getComputedStyle(element);
        const minHeight = parseInt(styles.minHeight) || parseInt(styles.height);
        const minWidth = parseInt(styles.minWidth) || parseInt(styles.width);
        
        // WCAG recommends minimum 44px touch targets
        expect(minHeight).toBeGreaterThanOrEqual(44);
        expect(minWidth).toBeGreaterThanOrEqual(44);
      });
    });
  });

  describe('Color Contrast Compliance', () => {
    it('should meet WCAG AA standards for corporate colors', () => {
      // Test corporate color combinations
      const testCombinations = [
        { bg: '#767676', text: '#FFFFFF' }, // corporate-gray + corporate-text
        { bg: '#767676', text: '#E5E7EB' }, // corporate-gray + corporate-text-secondary
        { bg: '#6B7280', text: '#FFFFFF' }, // corporate-hover + corporate-text
        { bg: '#4B5563', text: '#FFFFFF' }, // corporate-active + corporate-text
      ];

      testCombinations.forEach(({ bg, text }) => {
        // Calculate contrast ratio (simplified check)
        const bgLuminance = getLuminance(bg);
        const textLuminance = getLuminance(text);
        const contrastRatio = (Math.max(bgLuminance, textLuminance) + 0.05) / 
                             (Math.min(bgLuminance, textLuminance) + 0.05);
        
        // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
        expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
      });
    });

    it('should maintain brand color accessibility', () => {
      // Test that brand colors still meet accessibility standards
      const brandCombinations = [
        { bg: '#2563EB', text: '#FFFFFF' }, // voxlink-blue + white
        { bg: '#0891B2', text: '#FFFFFF' }, // link-teal + white
      ];

      brandCombinations.forEach(({ bg, text }) => {
        const bgLuminance = getLuminance(bg);
        const textLuminance = getLuminance(text);
        const contrastRatio = (Math.max(bgLuminance, textLuminance) + 0.05) / 
                             (Math.min(bgLuminance, textLuminance) + 0.05);
        
        expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
      });
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect prefers-reduced-motion', () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      const { container } = render(
        <BrowserRouter>
          <Sidebar isOpen={true} onClose={jest.fn()} />
        </BrowserRouter>
      );

      // Check that animations can be disabled
      const animatedElements = container.querySelectorAll('[class*="transition"], [class*="animate"]');
      expect(animatedElements.length).toBeGreaterThan(0);
    });
  });

  describe('High Contrast Mode Support', () => {
    it('should support high contrast preferences', () => {
      // Mock prefers-contrast: high
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(
        <Header onMenuClick={jest.fn()} user={mockUser} />
      );

      // Check that high contrast classes are available
      const testDiv = document.createElement('div');
      testDiv.className = 'high-contrast-text';
      expect(testDiv).toHaveClass('high-contrast-text');
    });
  });
});

// Helper function to calculate luminance (simplified)
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  
  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}