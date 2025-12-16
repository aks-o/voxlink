/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // VoxLink Brand Colors
        'voxlink-blue': '#2563EB',
        'link-teal': '#0891B2',
        'success-green': '#059669',
        'warning-amber': '#D97706',
        'error-red': '#DC2626',
        'charcoal': '#374151',
        'slate': '#64748B',
        'light-gray': '#F1F5F9',
        // Corporate Colors
        'corporate-gray': '#767676',
        'corporate-text': '#FFFFFF',
        'corporate-text-secondary': '#E5E7EB',
        'corporate-hover': '#6B7280',
        'corporate-active': '#4B5563',
      },
      fontFamily: {
        'roboto': ['Roboto', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Touch device queries
        'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
        'no-touch': { 'raw': '(hover: hover) and (pointer: fine)' },
        // Orientation queries
        'portrait': { 'raw': '(orientation: portrait)' },
        'landscape': { 'raw': '(orientation: landscape)' },
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
      fontSize: {
        'mobile-xs': ['12px', '16px'],
        'mobile-sm': ['14px', '20px'],
        'mobile-base': ['16px', '24px'],
        'mobile-lg': ['18px', '28px'],
        'mobile-xl': ['20px', '28px'],
        'mobile-2xl': ['24px', '32px'],
        // Corporate Typography Scale
        'corporate-nav-primary': ['14px', '20px'],
        'corporate-nav-secondary': ['12px', '16px'],
        'corporate-header': ['16px', '24px'],
        'corporate-body': ['14px', '20px'],
        'corporate-small': ['12px', '16px'],
        'corporate-large': ['18px', '28px'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in-bottom': 'slideInFromBottom 0.3s ease-out',
        'slide-in-top': 'slideInFromTop 0.3s ease-out',
        'slide-in-left': 'slideInFromLeft 0.3s ease-out',
        'slide-in-right': 'slideInFromRight 0.3s ease-out',
        'loading-shimmer': 'loading-shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInFromBottom: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInFromTop: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInFromLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInFromRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'loading-shimmer': {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
      },
    },
  },
  plugins: [
    // Custom plugin for mobile utilities
    function({ addUtilities }) {
      const newUtilities = {
        '.touch-manipulation': {
          'touch-action': 'manipulation',
          '-webkit-tap-highlight-color': 'transparent',
        },
        '.smooth-scroll': {
          '-webkit-overflow-scrolling': 'touch',
          'scroll-behavior': 'smooth',
        },
        '.no-scroll': {
          'overflow': 'hidden',
          'position': 'fixed',
          'width': '100%',
        },
        '.safe-area-inset-top': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        '.safe-area-inset-bottom': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
        '.safe-area-inset-left': {
          'padding-left': 'env(safe-area-inset-left)',
        },
        '.safe-area-inset-right': {
          'padding-right': 'env(safe-area-inset-right)',
        },
        // Corporate styling utilities
        '.corporate-bg': {
          'background-color': '#767676',
        },
        '.corporate-text': {
          'color': '#FFFFFF',
        },
        '.corporate-text-secondary': {
          'color': '#E5E7EB',
        },
        '.corporate-hover': {
          'background-color': '#6B7280',
        },
        '.corporate-active': {
          'background-color': '#4B5563',
        },
        '.corporate-border': {
          'border-color': '#6B7280',
        },
      }
      
      addUtilities(newUtilities)
    }
  ],
};