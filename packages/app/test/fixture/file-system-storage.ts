import { emptyFn, isDefined } from '@rnw-community/shared';

export class FileSystemStorage {
    readonly files = new Map<string, string>();
    readonly modified = new Map<string, number>();
    readonly events = new Array<string>();
    readonly deleted = new Array<string>();
    failDelete: string | null = null;
    failWrite = false;
    failCopy = false;
    failMoveFrom: string | null = null;
    failMoveBackFrom: string | null = null;
    crashAfterRemove = false;
    beforeTransfer: (sourceUri: string) => void = emptyFn;
    afterTransfer: (sourceUri: string) => void = emptyFn;

    checkpoint(uri: string) {
        const wal = this.files.get(`${uri}-wal`);
        const contents = this.files.get(uri);
        if (isDefined(wal) && isDefined(contents)) {
            this.files.set(
                uri,
                contents.replace(/^[^@]*/u, rows => `${rows}+${wal}`)
            );
        }
        this.files.delete(`${uri}-wal`);
        this.files.delete(`${uri}-shm`);
    }
}
