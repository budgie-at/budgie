import type { SyncUploadDeletionInterface } from './sync-upload-deletion.interface';
import type { SyncUploadRejectionInterface } from './sync-upload-rejection.interface';
import type { SyncUploadSaveInterface } from './sync-upload-save.interface';

export interface SyncUploadBatchInterface {
    readonly saves: readonly SyncUploadSaveInterface[];
    readonly deletions: readonly SyncUploadDeletionInterface[];
    readonly rejections: readonly SyncUploadRejectionInterface[];
}
