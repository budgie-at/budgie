import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

const SOURCE_DIRECTORY = join(import.meta.dirname, '../src');

const findSourcesMatching = (pattern: RegExp) =>
    Effect.sync(() =>
        readdirSync(SOURCE_DIRECTORY, { recursive: true, withFileTypes: true })
            .filter(entry => entry.isFile() && /\.tsx?$/u.test(entry.name))
            .map(entry => join(entry.parentPath, entry.name))
            .flatMap(path => Array.from(readFileSync(path, 'utf8').matchAll(pattern), () => relative(SOURCE_DIRECTORY, path)))
            .sort()
    );

describe('single atom registry', () => {
    it.effect.each([
        {
            action: 'provides a registry',
            pattern: /<(?:RegistryContext\.Provider|RegistryProvider)\b/gu,
            expectedSources: ['app/_layout.tsx']
        },
        {
            action: 'creates a registry',
            pattern: /\bAtomRegistry\.(?:make\(|layer\b|layerOptions\()/gu,
            expectedSources: ['@generic/constant/app-atom-registry.constant.ts']
        }
    ])('only the root $action', ({ pattern, expectedSources }) =>
        Effect.map(findSourcesMatching(pattern), sources => {
            expect(sources).toEqual(expectedSources);
        })
    );
});
