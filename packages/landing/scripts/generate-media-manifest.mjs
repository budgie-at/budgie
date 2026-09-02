import { writeFileSync } from 'node:fs';

import { MANIFEST_PATH, collectMediaAssets, formatSource, renderManifestSource } from './media-manifest-builder.mjs';

const { assets, errors } = collectMediaAssets();

if (errors.length > 0) {
    for (const error of errors) {
        process.stderr.write(`media:manifest  ${error}\n`);
    }

    process.exit(1);
}

writeFileSync(MANIFEST_PATH, renderManifestSource(assets), 'utf8');
formatSource(MANIFEST_PATH);

process.stdout.write(`media:manifest  wrote ${assets.length} asset(s) to src/generic/constant/media-manifest.constant.ts\n`);
