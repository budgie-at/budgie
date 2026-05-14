/* eslint-disable no-console */
import { randomInt as cryptoRandomInt } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export const ensureBenchDir = (file: string): void => {
    const dir = dirname(file);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
};

export const benchRandomInt = (min: number, maxExclusive: number): number => cryptoRandomInt(min, maxExclusive);

export const benchPercentile = (values: number[], p: number): number => {
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.floor((sorted.length - 1) * p);

    return sorted[idx];
};
