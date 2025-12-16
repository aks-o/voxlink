import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

import { useResponsive } from '../hooks/useResponsive';
import { useOffline } from '../hooks/useOffline';
import MobileNumberCard from '../components/Mobile/MobileNumberCard';
import MobileNavigation from '../components/Mobile/MobileNavigation';
import MobileNumberSearch from '../components/Mobile/MobileNumberSearch';
import ResponsiveLayout from '../components/Layout/ResponsiveLayout';

// Mock hooks
jest.mock('../hooks/useResponsive');
jest.mock('../hooks/useOffline');

const mockUseResponsive = useResponsive as jest.MockedFunction<typeof useResponsive>;
const mockUseOffline = useOffline as jest.MockedFunction<typeof useOffline>;

// Test utilities
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Mock data
const mockNumber = {
  phoneNumber: '+1 (555) 123-4567',
  countryCode: 'US',
  areaCode: '555',
  city: 'New York',
  region: 'NY',
  monthlyRate: 1000, // $10.00 in cents
  setupFee: 500, // $5.00 in cents
  features: ['SMS', 'VOICE', 'MMS'],
  score: 4,
};

describe('Responsive Components', () => {
  beforeEach(() => {
    // Reset mocks
    mockUseResponsive.mockReturnValue({
      width: 1024,
      height: 768,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isLandscape: true,
      isPortrait: false,
      breakpoint: 'lg',
      isTouchDevice: false,
    });

    mockUseOffline.mockReturnValue({
      isOnline: true,
      isOffline: false,
      wasOffline: false,
    });
  });

  describe('useResponsive Hook', () => {
    it('should detect mobile viewport', () => {
      mockUseResponsive.mockReturnValue({
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isLandscape: false,
        isPortrait: true,
        breakpoint: 'sm',
        isTouchDevice: true,
      });

      const TestComponent = () => {
        const { isMobile, isTouchDevice } = useResponsive();
        return (
          <div>
            <span data-testid="is-mobile">{isMobile.toString()}</span>
            <span data-testid="is-touch">{isTouchDevice.toString()}</span>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('is-mobile')).toHaveTextContent('true');
      expect(screen.getByTestId('is-touch')).toHaveTextContent('true');
    });

    it('should detect tablet viewport', () => {
      mockUseResponsive.mockReturnValue({
        width: 768,
        height: 1024,
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        isLandscape: false,
        isPortrait: true,
        breakpoint: 'md',
        isTouchDevice: true,
      });

      const TestComponent = () => {
        const { isTablet } = useResponsive();
        return <span data-testid="is-tablet">{isTablet.toString()}</span>;
      };

      render(<TestComponent />);

      expect(screen.getByTestId('is-tablet')).toHaveTextContent('true');
    });

    it('should detect desktop viewport', () => {
      const TestComponent = () => {
        const { isDesktop } = useResponsive();
        return <span data-testid="is-desktop">{isDesktop.toString()}</span>;
      };

      render(<TestComponent />);

      expect(screen.getByTestId('is-desktop')).toHaveTextContent('true');
    });
  });

  describe('MobileNumberCard', () => {
    const mockOnReserve = jest.fn();
    const mockOnSelect = jest.fn();

    beforeEach(() => {
      mockOnReserve.mockClear();
      mockOnSelect.mockClear();
      
      mockUseResponsive.mockReturnValue({
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isLandscape: false,
        isPortrait: true,
        breakpoint: 'sm',
        isTouchDevice: true,
      });
    });

    it('should render number information correctly', () => {
      renderWithProviders(
        <MobileNumberCard
          number={mockNumber}
          onReserve={mockOnReserve}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText(mockNumber.phoneNumber)).toBeInTheDocument();
      expect(screen.getByText(`${mockNumber.city}, ${mockNumber.region}`)).toBeInTheDocument();
      expect(screen.getByText('$10.00')).toBeInTheDocument(); // Monthly rate
      expect(screen.getByText('$5.00')).toBeInTheDocument(); // Setup fee
    });

    it('should show features correctly', () => {
      renderWithProviders(
        <MobileNumberCard
          number={mockNumber}
          onReserve={mockOnReserve}
          onSelect={mockOnSelect}
        />
      );

      mockNumber.features.forEach(feature => {
        expect(screen.getByText(feature)).toBeInTheDocument();
      });
    });

    it('should handle reserve button click', () => {
      renderWithProviders(
        <MobileNumberCard
          number={mockNumber}
          onReserve={mockOnReserve}
          onSelect={mockOnSelect}
        />
      );

      const reserveButton = screen.getByText('Reserve & Buy');
      fireEvent.click(reserveButton);

      expect(mockOnReserve).toHaveBeenCalledWith(mockNumber.phoneNumber);
    });

    it('should show loading state when reserving', () => {
      renderWithProviders(
        <MobileNumberCard
          number={mockNumber}
          onReserve={mockOnReserve}
          onSelect={mockOnSelect}
          isReserving={true}
        />
      );

      expect(screen.getByText('Reserving...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reserving/i })).toBeDisabled();
    });

    it('should expand and collapse details', () => {
      renderWithProviders(
        <MobileNumberCard
          number={mockNumber}
          onReserve={mockOnReserve}
          onSelect={mockOnSelect}
        />
      );

      const expandButton = screen.getByLabelText('Expand details');
      fireEvent.click(expandButton);

      expect(screen.getByText('Country Code:')).toBeInTheDocument();
      expect(screen.getByText('Area Code:')).toBeInTheDocument();

      const collapseButton = screen.getByLabelText('Collapse details');
      fireEvent.click(collapseButton);

      expect(screen.queryByText('Country Code:')).not.toBeInTheDocument();
    });

    it('should handle selection on touch devices', () => {
      renderWithProviders(
        <MobileNumberCard
          number={mockNumber}
          onReserve={mockOnReserve}
          onSelect={mockOnSelect}
          isSelected={false}
        />
      );

      const card = screen.getByText(mockNumber.phoneNumber).closest('div');
      fireEvent.click(card!);

      expect(mockOnSelect).toHaveBeenCalledWith(mockNumber.phoneNumber);
    });
  });

  describe('MobileNavigation', () => {
    const mockOnClose = jest.fn();

    beforeEach(() => {
      mockOnClose.mockClear();
      
      mockUseResponsive.mockReturnValue({
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isLandscape: false,
        isPortrait: true,
        breakpoint: 'sm',
        isTouchDevice: true,
      });
    });

    it('should render navigation items', () => {
      renderWithProviders(
        <MobileNavigation isOpen={true} onClose={mockOnClose} />
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Numbers')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('should handle close button click', () => {
      renderWithProviders(
        <MobileNavigation isOpen={true} onClose={mockOnClose} />
      );

      const closeButton = screen.getByLabelText('Close navigation');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not render on desktop', () => {
      mockUseResponsive.mockReturnValue({
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLandscape: true,
        isPortrait: false,
        breakpoint: 'lg',
        isTouchDevice: false,
      });

      const { container } = renderWithProviders(
        <MobileNavigation isOpen={true} onClose={mockOnClose} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should expand and collapse sub-items', () => {
      renderWithProviders(
        <MobileNavigation isOpen={true} onClose={mockOnClose} />
      );

      const numbersExpandButton = screen.getByLabelText('Expand Numbers');
      fireEvent.click(numbersExpandButton);

      expect(screen.getByText('Search Numbers')).toBeInTheDocument();
      expect(screen.getByText('My Numbers')).toBeInTheDocument();

      const numbersCollapseButton = screen.getByLabelText('Collapse Numbers');
      fireEvent.click(numbersCollapseButton);

      expect(screen.queryByText('Search Numbers')).not.toBeInTheDocument();
    });
  });

  describe('MobileNumberSearch', () => {
    const mockOnSearch = jest.fn();
    const mockOnReserveNumber = jest.fn();

    beforeEach(() => {
      mockOnSearch.mockClear();
      mockOnReserveNumber.mockClear();
      
      mockUseResponsive.mockReturnValue({
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isLandscape: false,
        isPortrait: true,
        breakpoint: 'sm',
        isTouchDevice: true,
      });
    });

    it('should render search interface', () => {
      renderWithProviders(
        <MobileNumberSearch
          onSearch={mockOnSearch}
          onReserveNumber={mockOnReserveNumber}
        />
      );

      expect(screen.getByPlaceholderText('Area code or city...')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
    });

    it('should handle quick search', () => {
      renderWithProviders(
        <MobileNumberSearch
          onSearch={mockOnSearch}
          onReserveNumber={mockOnReserveNumber}
        />
      );

      const searchInput = screen.getByPlaceholderText('Area code or city...');
      const searchButton = screen.getByText('Search');

      fireEvent.change(searchInput, { target: { value: '212' } });
      fireEvent.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalled();
    });

    it('should show and hide filters', () => {
      renderWithProviders(
        <MobileNumberSearch
          onSearch={mockOnSearch}
          onReserveNumber={mockOnReserveNumber}
        />
      );

      const filterButton = screen.getByRole('button', { name: /filter/i });
      fireEvent.click(filterButton);

      expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('should render search results', () => {
      renderWithProviders(
        <MobileNumberSearch
          onSearch={mockOnSearch}
          onReserveNumber={mockOnReserveNumber}
          searchResults={[mockNumber]}
        />
      );

      expect(screen.getByText('Available Numbers (1)')).toBeInTheDocument();
      expect(screen.getByText(mockNumber.phoneNumber)).toBeInTheDocument();
    });

    it('should show error state', () => {
      renderWithProviders(
        <MobileNumberSearch
          onSearch={mockOnSearch}
          onReserveNumber={mockOnReserveNumber}
          error="Search failed"
        />
      );

      expect(screen.getByText('Search Error')).toBeInTheDocument();
      expect(screen.getByText('Search failed')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      renderWithProviders(
        <MobileNumberSearch
          onSearch={mockOnSearch}
          onReserveNumber={mockOnReserveNumber}
          isLoading={true}
        />
      );

      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });
  });

  describe('ResponsiveLayout', () => {
    beforeEach(() => {
      mockUseOffline.mockReturnValue({
        isOnline: true,
        isOffline: false,
        wasOffline: false,
      });
    });

    it('should render desktop layout', () => {
      renderWithProviders(
        <ResponsiveLayout>
          <div data-testid="content">Test Content</div>
        </ResponsiveLayout>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should show offline notice when offline', () => {
      mockUseOffline.mockReturnValue({
        isOnline: false,
        isOffline: true,
        wasOffline: false,
      });

      renderWithProviders(
        <ResponsiveLayout>
          <div data-testid="content">Test Content</div>
        </ResponsiveLayout>
      );

      expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
    });

    it('should show back online notice', async () => {
      mockUseOffline.mockReturnValue({
        isOnline: true,
        isOffline: false,
        wasOffline: true,
      });

      renderWithProviders(
        <ResponsiveLayout>
          <div data-testid="content">Test Content</div>
        </ResponsiveLayout>
      );

      expect(screen.getByText('Back online!')).toBeInTheDocument();
    });

    it('should adapt layout for mobile', () => {
      mockUseResponsive.mockReturnValue({
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isLandscape: false,
        isPortrait: true,
        breakpoint: 'sm',
        isTouchDevice: true,
      });

      renderWithProviders(
        <ResponsiveLayout>
          <div data-testid="content">Test Content</div>
        </ResponsiveLayout>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
      // Mobile-specific elements should be present
      expect(screen.getByText('Online')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseResponsive.mockReturnValue({
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isLandscape: false,
        isPortrait: true,
        breakpoint: 'sm',
        isTouchDevice: true,
      });
    });

    it('should have proper ARIA labels', () => {
      renderWithProviders(
        <MobileNumberCard
          number={mockNumber}
          onReserve={jest.fn()}
          onSelect={jest.fn()}
        />
      );

      expect(screen.getByLabelText('Expand details')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      const mockOnReserve = jest.fn();
      
      renderWithProviders(
        <MobileNumberCard
          number={mockNumber}
          onReserve={mockOnReserve}
          onSelect={jest.fn()}
        />
      );

      const reserveButton = screen.getByText('Reserve & Buy');
      reserveButton.focus();
      fireEvent.keyDown(reserveButton, { key: 'Enter' });

      expect(mockOnReserve).toHaveBeenCalledWith(mockNumber.phoneNumber);
    });

    it('should have minimum touch target sizes', () => {
      renderWithProviders(
        <MobileNumberCard
          number={mockNumber}
          onReserve={jest.fn()}
          onSelect={jest.fn()}
        />
      );

      const reserveButton = screen.getByText('Reserve & Buy');
      const styles = window.getComputedStyle(reserveButton);
      
      // Should have minimum 44px height for touch targets
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
    });
  });
});