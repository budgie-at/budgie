import { SyncProgressInterface } from '../../sync/interface/sync-progress.interface';

export type SyncProgressCallbackType = (data: Partial<SyncProgressInterface>) => void;
