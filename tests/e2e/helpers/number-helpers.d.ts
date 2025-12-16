export interface TestNumber {
    id: string;
    phoneNumber: string;
    countryCode: string;
    areaCode: string;
    city: string;
    region: string;
    status: 'available' | 'reserved' | 'active' | 'suspended';
    ownerId: string | null;
    monthlyRate: number;
    setupFee: number;
    features: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const createTestNumber: (ownerId?: string) => Promise<TestNumber>;
export declare const createAvailableNumbers: (count?: number) => Promise<TestNumber[]>;
export declare const createNumberWithConfiguration: (ownerId: string) => Promise<{
    number: TestNumber;
    configuration: {
        id: string;
        numberId: string;
        callForwarding: {
            enabled: boolean;
            primaryDestination: string;
            timeout: number;
        };
        businessHours: {
            timezone: string;
            schedule: {
                monday: {
                    open: string;
                    close: string;
                    enabled: boolean;
                };
                tuesday: {
                    open: string;
                    close: string;
                    enabled: boolean;
                };
                wednesday: {
                    open: string;
                    close: string;
                    enabled: boolean;
                };
                thursday: {
                    open: string;
                    close: string;
                    enabled: boolean;
                };
                friday: {
                    open: string;
                    close: string;
                    enabled: boolean;
                };
                saturday: {
                    open: string;
                    close: string;
                    enabled: boolean;
                };
                sunday: {
                    open: string;
                    close: string;
                    enabled: boolean;
                };
            };
        };
        voicemail: {
            enabled: boolean;
            greeting: string;
            emailNotifications: boolean;
        };
        createdAt: Date;
        updatedAt: Date;
    };
}>;
export declare const generatePhoneNumber: (countryCode?: string, areaCode?: string) => string;
