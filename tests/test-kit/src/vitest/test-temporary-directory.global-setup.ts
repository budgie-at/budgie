import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export default () => {
    const temporaryDirectoryPath = mkdtempSync(join(tmpdir(), 'budgie-tests-'));
    process.env['TMPDIR'] = temporaryDirectoryPath;

    return () => {
        rmSync(temporaryDirectoryPath, { recursive: true, force: true });
    };
};
