import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { TestProject } from 'vitest/node';

export default (project: TestProject) => {
    const temporaryDirectoryPath = mkdtempSync(join(tmpdir(), 'budgie-tests-'));
    process.env['TMPDIR'] = temporaryDirectoryPath;
    process.stdout.write(
        `[test-kit] ${project.name || 'tests'} shuffle seed ${project.config.sequence.seed} (reproduce with VITEST_SEED=${project.config.sequence.seed})\n`
    );

    return () => {
        rmSync(temporaryDirectoryPath, { recursive: true, force: true });
    };
};
