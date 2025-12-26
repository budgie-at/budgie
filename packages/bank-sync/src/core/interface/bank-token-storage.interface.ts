export interface BankTokenStorageInterface {
    getToken(): Promise<string | null>;
    saveToken(token: string): Promise<void>;
    deleteToken(): Promise<void>;
}
