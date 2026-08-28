export interface SyncTokenStorageInterface {
    getToken(): Promise<string | null>;
    saveToken(token: string): Promise<void>;
    deleteToken(): Promise<void>;
}
