import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export function writeManifest({ file, assets, theme, renderedPosts }) {
    const previous = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { assets: [] };
    const kept = (previous.assets ?? []).filter(asset => !renderedPosts.has(asset.post));
    const merged = [...kept, ...assets].sort((left, right) => (left.file === right.file ? 0 : left.file < right.file ? -1 : 1));

    writeFileSync(
        file,
        `${JSON.stringify(
            {
                generatedAt: new Date().toISOString(),
                theme,
                format: 'png',
                colorSpace: 'sRGB',
                assets: merged
            },
            null,
            2
        )}\n`
    );

    return merged.length;
}
