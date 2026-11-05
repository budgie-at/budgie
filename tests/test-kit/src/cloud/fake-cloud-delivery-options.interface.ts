export interface FakeCloudDeliveryOptionsInterface {
    readonly order?: 'upload' | 'reverse' | 'shuffled';
    readonly chunkSize?: number;
    readonly isDuplicated?: boolean;
    readonly accountId?: string;
}
