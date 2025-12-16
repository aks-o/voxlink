declare class TelecomProviderMock {
    private providers;
    constructor();
    private initializeProviders;
    private generateMockNumbers;
    searchNumbers(criteria: {
        country?: string;
        areaCode?: string;
        pattern?: string;
        features?: string[];
        priceRange?: {
            min: number;
            max: number;
        };
        limit?: number;
    }): any[];
    reserveNumber(numberId: string, userId: string): {
        success: boolean;
        reservationId?: string;
        error?: string;
    };
    activateNumber(numberId: string): {
        success: boolean;
        error?: string;
    };
    deactivateNumber(numberId: string): {
        success: boolean;
        error?: string;
    };
    private findNumberById;
    private isNumberReservedOrActivated;
    reset(): void;
    simulateDelay(min?: number, max?: number): Promise<void>;
    simulateFailure(probability?: number): boolean;
}
export declare const mockTelecomProvider: TelecomProviderMock;
export {};
