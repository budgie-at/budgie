import { Directory } from './expo-directory-fake';

export { Directory };

import { isDefined, isString } from '@rnw-community/shared';

export const storage = {
    files: new Map<string, string>(),
    modified: new Map<string, number>(),
    events: new Array<string>(),
    deleted: new Array<string>(),
    failWrite: false,
    failCopy: false,
    failMove: false,
    crashAfterRemove: false
};

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
        const target = destination instanceof Directory ? new File(destination, this.name) : destination;
        if (storage.failMove && this.uri.endsWith('import-temp.db')) {
            throw new Error('move failed');
        }
        if (target.exists && options?.overwrite !== true) {
            throw new Error('EEXIST');
        }
        if (options?.overwrite === true) {
            storage.files.delete(target.uri);
        }
        if (storage.crashAfterRemove) {
            throw new Error('crash');
        }
        const contents = this.textSync();
        storage.events.push('move');
        storage.files.set(target.uri, contents);
        storage.files.delete(this.uri);
        this.uri = target.uri;
    }

    move(destination: File | Directory, options?: { overwrite?: boolean }) {
        this.moveSync(destination, options);

        return Promise.resolve();
    }

    copy(destination: File | Directory, options?: { overwrite?: boolean }) {
        if (storage.failCopy) {
            throw new Error('copy failed');
        }
        const target = destination instanceof Directory ? new File(destination, this.name) : destination;
        if (target.exists && options?.overwrite !== true) {
            throw new Error('EEXIST');
        }
        storage.files.set(target.uri, this.textSync());

        return Promise.resolve();
    }

    delete() {
        if (!this.exists) {
            throw new Error('ENOENT');
        }
        storage.deleted.push(this.uri);
        storage.files.delete(this.uri);
    }
}

export const Paths = { document: 'documents', cache: { uri: 'cache' } };
