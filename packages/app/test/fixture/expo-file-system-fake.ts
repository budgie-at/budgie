import { Directory } from './expo-directory-fake';
import { FileSystemStorage } from './file-system-storage';

export { Directory };

import { emptyFn, isDefined, isString } from '@rnw-community/shared';

export const storage = new FileSystemStorage();

export class File {
    uri: string;

    constructor(parent: string | Pick<File, 'uri'>, name?: string) {
        const parentUri = isString(parent) ? parent : parent.uri;
        this.uri = isDefined(name) ? `${parentUri}/${name}` : parentUri;
    }

    get name() {
        return this.uri.split('/').at(-1) ?? '';
    }

    get exists() {
        return storage.files.has(this.uri);
    }

    get lastModified() {
        return storage.modified.get(this.uri) ?? null;
    }

    create(options?: { overwrite?: boolean; idempotent?: boolean; intermediates?: boolean }) {
        if (this.exists && options?.overwrite !== true) {
            throw new Error('EEXIST');
        }
        storage.files.set(this.uri, '');
    }

    textSync() {
        const contents = storage.files.get(this.uri);
        if (!isDefined(contents)) {
            throw new Error('ENOENT');
        }

        return contents;
    }

    writeSync(contents: string) {
        storage.events.push('write');
        if (storage.failWrite) {
            throw new Error('Disk full');
        }
        storage.files.set(this.uri, contents);
    }

    moveSync(destination: File | Directory, options?: { overwrite?: boolean }) {
        storage.beforeTransfer(this.uri);
        if (storage.failMoveFrom === this.uri || storage.failMoveBackFrom === this.uri) {
            throw new Error('move failed');
        }
        const target = this.prepareDestination(destination, options);
        if (storage.crashAfterRemove) {
            throw new Error('crash');
        }
        const contents = this.textSync();
        const source = this.uri;
        storage.events.push('move');
        storage.files.set(target.uri, contents);
        const modified = storage.modified.get(this.uri);
        storage.modified.delete(this.uri);
        if (isDefined(modified)) {
            storage.modified.set(target.uri, modified);
        }
        storage.files.delete(this.uri);
        this.uri = target.uri;
        storage.afterTransfer(source);
    }

    move(destination: File | Directory, options?: { overwrite?: boolean }) {
        this.moveSync(destination, options);

        return Promise.resolve();
    }

    copy(destination: File | Directory, options?: { overwrite?: boolean }) {
        storage.beforeTransfer(this.uri);
        if (storage.failCopy) {
            throw new Error('copy failed');
        }
        const target = this.prepareDestination(destination, options);
        storage.files.set(target.uri, this.textSync());
        storage.afterTransfer(this.uri);

        return Promise.resolve();
    }

    delete() {
        if (storage.failDelete === this.uri) {
            throw new Error('delete failed');
        }
        if (!this.exists) {
            throw new Error('ENOENT');
        }
        storage.modified.delete(this.uri);
        storage.deleted.push(this.uri);
        storage.files.delete(this.uri);
    }

    private prepareDestination(destination: File | Directory, options?: { overwrite?: boolean }) {
        const target = destination instanceof Directory ? new File(destination, this.name) : destination;
        if (target.exists && options?.overwrite !== true) {
            throw new Error('EEXIST');
        }
        if (options?.overwrite === true) {
            storage.files.delete(target.uri);
            storage.modified.delete(target.uri);
        }

        return target;
    }
}

export const Paths = { document: 'documents', cache: { uri: 'cache' } };

export const resetStorage = () => {
    storage.files.clear();
    storage.modified.clear();
    storage.events.splice(0);
    storage.deleted.splice(0);
    storage.failDelete = null;
    storage.failWrite = false;
    storage.failCopy = false;
    storage.failMoveFrom = null;
    storage.failMoveBackFrom = null;
    storage.crashAfterRemove = false;
    storage.beforeTransfer = emptyFn;
    storage.afterTransfer = emptyFn;
};
