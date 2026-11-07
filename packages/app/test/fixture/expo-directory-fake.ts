import { vi } from 'vitest';

import { isDefined, isString } from '@rnw-community/shared';

import { storage } from './expo-file-system-fake';

export class Directory {
    static readonly pickDirectoryAsync = vi.fn<() => Promise<Pick<Directory, 'uri'>>>();
    readonly uri: string;

    constructor(parent: string | Pick<Directory, 'uri'>, name?: string) {
        const parentUri = isString(parent) ? parent : parent.uri;
        this.uri = isDefined(name) ? `${parentUri}/${name}` : parentUri;
    }

    get exists() {
        return storage.files.has(this.uri);
    }

    create(options?: { overwrite?: boolean; idempotent?: boolean; intermediates?: boolean }) {
        if (this.exists && !options?.idempotent && !options?.overwrite) {
            throw new Error('EEXIST');
        }
        storage.files.set(this.uri, '');
    }
}
