import React from 'react';
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
interface MobileNumberCardProps {
    number: AvailableNumber;
    onReserve: (phoneNumber: string) => void;
    isReserving?: boolean;
    isSelected?: boolean;
    onSelect?: (phoneNumber: string) => void;
}
declare const MobileNumberCard: React.FC<MobileNumberCardProps>;
export default MobileNumberCard;
