export interface SearchCriteria {
    countryCode: string;
    areaCode?: string;
    city?: string;
    region?: string;
    pattern?: string;
    features?: string[];
    maxSetupFee?: number;
    maxMonthlyRate?: number;
    limit?: number;
}
export interface AvailableNumber {
    phoneNumber: string;
    countryCode: string;
    areaCode: string;
    city: string;
    region: string;
    monthlyRate: number;
    setupFee: number;
    features: string[];
    provider: string;
    reservationId?: string;
    reservationExpiry?: Date;
}
export interface NumberReservation {
    id: string;
    phoneNumber: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
}
export interface SearchResult {
    numbers: AvailableNumber[];
    totalCount: number;
    searchId: string;
    timestamp: Date;
}
