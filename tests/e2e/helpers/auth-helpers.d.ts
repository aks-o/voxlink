export interface TestUser {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
    accountId: string;
}
export declare const createTestUser: (overrides?: Partial<TestUser>) => Promise<TestUser>;
export declare const generateAuthToken: (user: TestUser) => string;
export declare const createAdminUser: () => Promise<TestUser>;
export declare const createExpiredToken: (user: TestUser) => string;
export declare const createInvalidToken: () => string;
