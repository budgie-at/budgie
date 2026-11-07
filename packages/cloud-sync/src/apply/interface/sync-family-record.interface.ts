export interface SyncFamilyRecordInterface {
    readonly syncZone: string;
    readonly syncId: string;
    readonly payload: string | null;
    readonly systemFields: string | null;
    readonly isPending: number;
}
