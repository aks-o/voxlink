import React from 'react';
interface SearchCriteria {
    countryCode: string;
    areaCode: string;
    city: string;
    region: string;
    pattern: string;
    maxMonthlyRate: string;
    maxSetupFee: string;
    features: string[];
}
interface AvailableNumber {
    phoneNumber: string;
    countryCode: string;
    areaCode: string;
    city: string;
    region: string;
    monthlyRate: number;
    setupFee: number;
    features: string[];
    score?: number;
}
interface MobileNumberSearchProps {
    onSearch: (criteria: SearchCriteria) => void;
    onReserveNumber: (phoneNumber: string) => void;
    searchResults?: AvailableNumber[];
    isLoading?: boolean;
    error?: string;
    reservingNumber?: string;
}
declare const MobileNumberSearch: React.FC<MobileNumberSearchProps>;
export default MobileNumberSearch;
