export interface BreakpointConfig {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
}
export type BreakpointKey = keyof BreakpointConfig;
export interface ResponsiveState {
    width: number;
    height: number;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isLandscape: boolean;
    isPortrait: boolean;
    breakpoint: BreakpointKey;
    isTouchDevice: boolean;
}
export declare function useResponsive(breakpoints?: BreakpointConfig): ResponsiveState;
export declare function useBreakpoint(breakpoint: BreakpointKey): boolean;
export declare function useIsMobile(): boolean;
export declare function useIsTablet(): boolean;
export declare function useIsDesktop(): boolean;
export declare function useIsTouchDevice(): boolean;
