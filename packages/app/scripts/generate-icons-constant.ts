import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { normalizeIconSearchText } from '../src/@generic/utils/normalize-icon-search-text.util.ts';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(SCRIPT_DIR, '..');
const SEARCH_INDEX_FILE = join(APP_DIR, 'src', '@generic', 'constant', 'icon-search-index.json');
const EMOJIBASE_DIR = join(APP_DIR, 'node_modules', 'emojibase-data');
const KEYWORDS_DIR = join(SCRIPT_DIR, 'icon-keywords');
const EXTRA_TAGS_FILE = join(SCRIPT_DIR, 'icon-tags.json');
const LEGACY_MAPPING_FILE = join(SCRIPT_DIR, 'icon-legacy-mapping.json');
const SEARCH_KEYWORDS_FILE = join(SCRIPT_DIR, 'icon-search-keywords.json');
const GLYPHS_FILE = join(APP_DIR, 'src', '@generic', 'constant', 'reicon-glyphs.json');
const CONTRACTS_DIR = resolve(APP_DIR, '../contracts/src/@generic');
const REICON_DIR = join(APP_DIR, 'node_modules', 'reicon-react-native');
const REICON_INDEX_FILE = join(REICON_DIR, 'index.d.ts');
const FILLED_ICON_NAMES = ['Star'];
const GLYPH_CONTAINER_TAGS: Record<string, string> = { clipPath: 'CLIP_PATH', defs: 'DEFS', g: 'GROUP' };
const GLYPH_SHAPE_GEOMETRY: Record<string, readonly string[]> = {
    circle: ['cx', 'cy', 'r'],
    ellipse: ['cx', 'cy', 'rx', 'ry'],
    line: ['x1', 'y1', 'x2', 'y2'],
    path: ['d'],
    polygon: ['points'],
    polyline: ['points'],
    rect: ['x', 'y', 'width', 'height', 'rx', 'ry']
};
const EMOJI_LANGUAGES = ['en', 'uk', 'de', 'es', 'fr'];
const EMOJI_COMPONENT_GROUP = 2;
const MIN_TRANSLATED_WORD_LENGTH = 3;
const StringArrayRecordSchema = Schema.Record(Schema.String, Schema.Array(Schema.String));
const StringRecordSchema = Schema.Record(Schema.String, Schema.String);

interface GlyphElement {
    readonly tag: string;
    readonly attributes: Record<string, string>;
    readonly children?: GlyphElement[];
}

const EmojibaseDataSchema = Schema.Array(
    Schema.Struct({
        emoji: Schema.String,
        label: Schema.String,
        tags: Schema.optional(Schema.Array(Schema.String)),
        group: Schema.optional(Schema.Number)
    })
);

const joinKeywords = (phrases: readonly string[]): string =>
    [...new Set(phrases.map(normalizeIconSearchText).filter(phrase => phrase.length > 0 && !phrase.includes('|')))].join('|');

const joinKeywordSections = (namePhrases: readonly string[], otherPhrases: readonly string[]): string =>
    `${joinKeywords(namePhrases)}||${joinKeywords(otherPhrases)}`;

const readWordTranslations = (): Record<string, string[]>[] =>
    existsSync(KEYWORDS_DIR)
        ? readdirSync(KEYWORDS_DIR)
              .filter(fileName => fileName.endsWith('.json'))
              .sort()
              .map(fileName => {
                  return Schema.decodeUnknownSync(StringArrayRecordSchema)(JSON.parse(readFileSync(join(KEYWORDS_DIR, fileName), 'utf8')));
              })
        : [];

const splitKeywordSection = (section: string): string[] => section.split('|').filter(isNotEmptyString);

const splitIconName = (name: string): string =>
    name.replaceAll(/([a-z0-9])([A-Z])/gu, '$1 $2').replaceAll(/([A-Z])([A-Z][a-z])/gu, '$1 $2');

const buildIconKeywords = (existingKeywords: string, extraTags: readonly string[]): string => {
    const [existingNameKeywords = '', existingOtherKeywords = ''] = existingKeywords.split('||');

    return joinKeywordSections(splitKeywordSection(existingNameKeywords), [...splitKeywordSection(existingOtherKeywords), ...extraTags]);
};

const buildIconIndex = (names: readonly string[], legacyMapping: Record<string, string>): [string, string][] => {
    const extraTagsByName = Schema.decodeUnknownSync(StringArrayRecordSchema)(JSON.parse(readFileSync(EXTRA_TAGS_FILE, 'utf8')));
    const legacyKeywords = Schema.decodeUnknownSync(StringRecordSchema)(JSON.parse(readFileSync(SEARCH_KEYWORDS_FILE, 'utf8')));
    const aliasesByName = new Map<string, string[]>();

    for (const [legacyName, name] of Object.entries(legacyMapping)) {
        aliasesByName.set(name, [...(aliasesByName.get(name) ?? []), legacyName]);
    }

    return names.map(name => {
        const aliases = aliasesByName.get(name) ?? [];
        const keywords = aliases.map(alias => buildIconKeywords(legacyKeywords[alias] ?? '', extraTagsByName[alias] ?? []));
        const namePhrases = keywords.flatMap(value => splitKeywordSection(value.split('||')[0]));
        const otherPhrases = keywords.flatMap(value => splitKeywordSection(value.split('||')[1] ?? ''));

        return [
            `reicon:${name}`,
            joinKeywordSections(
                [splitIconName(name), name, ...aliases.flatMap(alias => [splitIconName(alias), alias]), ...namePhrases],
                [...otherPhrases, ...(extraTagsByName[name] ?? [])]
            )
        ];
    });
};

const enumKey = (name: string): string => splitIconName(name).replaceAll(' ', '_').toUpperCase();

const generateCatalog = (names: readonly string[], legacyMapping: Record<string, string>): void => {
    writeFileSync(
        join(CONTRACTS_DIR, 'enum', 'reicon-icon-name.enum.ts'),
        `export enum ReiconIconNameEnum {\n${names.map(name => `    ${enumKey(name)} = 'reicon:${name}'`).join(',\n')}\n}\n`
    );

    writeFileSync(
        join(APP_DIR, 'src/@generic/constant/legacy-reicon-icons.constant.ts'),
        `import { ReiconIconNameEnum } from '@budgie/contracts';\n\nimport type { UserIconNameEnum } from '@budgie/contracts';\n\nexport const LEGACY_REICON_ICONS = {\n${Object.entries(
            legacyMapping
        )
            .sort(([first], [second]) => first.localeCompare(second, 'en'))
            .map(([legacyName, name]) => `    ${legacyName}: ReiconIconNameEnum.${enumKey(name)}`)
            .join(',\n')}\n} satisfies Record<UserIconNameEnum, ReiconIconNameEnum>;\n`
    );
};

const toGlyphAttributeName = (name: string): string => name.replaceAll(/-([a-z])/gu, (_, letter: string) => letter.toUpperCase());

const readGlyphNumber = (attributes: Record<string, string>, name: string): number => Number(attributes[name] ?? 0);

const buildEllipsePathData = (centerX: number, centerY: number, radiusX: number, radiusY: number): string =>
    `M${centerX - radiusX} ${centerY}A${radiusX} ${radiusY} 0 1 0 ${centerX + radiusX} ${centerY}A${radiusX} ${radiusY} 0 1 0 ${centerX - radiusX} ${centerY}Z`;

const buildPointsPathData = (points: string, isClosed: boolean): string => {
    const [first = '', ...rest] = (points.trim().match(/-?[\d.]+(?:e-?\d+)?/giu) ?? []).reduce<string[]>(
        (pairs, value, index) => (index % 2 === 0 ? [...pairs, value] : [...pairs.slice(0, -1), `${pairs.at(-1)} ${value}`]),
        []
    );

    return `M${first}${rest.map(point => `L${point}`).join('')}${isClosed ? 'Z' : ''}`;
};

const buildRectPathData = (attributes: Record<string, string>): string => {
    const x = readGlyphNumber(attributes, 'x');
    const y = readGlyphNumber(attributes, 'y');
    const width = readGlyphNumber(attributes, 'width');
    const height = readGlyphNumber(attributes, 'height');
    const radiusX = Math.min(Number(attributes.rx ?? attributes.ry ?? 0), width / 2);
    const radiusY = Math.min(Number(attributes.ry ?? attributes.rx ?? 0), height / 2);

    if (radiusX === 0 || radiusY === 0) {
        return `M${x} ${y}H${x + width}V${y + height}H${x}Z`;
    }

    const corner = `A${radiusX} ${radiusY} 0 0 1`;

    return `M${x + radiusX} ${y}H${x + width - radiusX}${corner} ${x + width} ${y + radiusY}V${y + height - radiusY}${corner} ${x + width - radiusX} ${y + height}H${x + radiusX}${corner} ${x} ${y + height - radiusY}V${y + radiusY}${corner} ${x + radiusX} ${y}Z`;
};

const buildShapePathData = (tag: string, attributes: Record<string, string>): string => {
    switch (tag) {
        case 'circle':
            return buildEllipsePathData(
                readGlyphNumber(attributes, 'cx'),
                readGlyphNumber(attributes, 'cy'),
                readGlyphNumber(attributes, 'r'),
                readGlyphNumber(attributes, 'r')
            );
        case 'ellipse':
            return buildEllipsePathData(
                readGlyphNumber(attributes, 'cx'),
                readGlyphNumber(attributes, 'cy'),
                readGlyphNumber(attributes, 'rx'),
                readGlyphNumber(attributes, 'ry')
            );
        case 'line':
            return `M${readGlyphNumber(attributes, 'x1')} ${readGlyphNumber(attributes, 'y1')}L${readGlyphNumber(attributes, 'x2')} ${readGlyphNumber(attributes, 'y2')}`;
        case 'polygon':
            return buildPointsPathData(attributes.points ?? '', true);
        case 'polyline':
            return buildPointsPathData(attributes.points ?? '', false);
        case 'rect':
            return buildRectPathData(attributes);
        default:
            return attributes.d ?? '';
    }
};

const toGlyphElement = (iconName: string, tag: string, attributes: Record<string, string>): GlyphElement => {
    const containerTag = GLYPH_CONTAINER_TAGS[tag];

    if (isDefined(containerTag)) {
        return { tag: containerTag, attributes, children: [] };
    }

    const geometry = GLYPH_SHAPE_GEOMETRY[tag];

    if (!isDefined(geometry)) {
        throw new Error(`Unsupported <${tag}> in Reicon ${iconName}`);
    }

    return {
        tag: 'PATH',
        attributes: {
            ...Object.fromEntries(Object.entries(attributes).filter(([name]) => !geometry.includes(name))),
            d: buildShapePathData(tag, attributes)
        }
    };
};

const parseGlyphMarkup = (iconName: string, markup: string): GlyphElement[] => {
    const root: GlyphElement = { tag: 'ROOT', attributes: {}, children: [] };
    const stack = [root];

    for (const [, closing, tag, rawAttributes, selfClosing] of markup.matchAll(/<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>/gu)) {
        if (closing === '/') {
            stack.pop();
            continue;
        }

        const attributes = Object.fromEntries(
            [...rawAttributes.matchAll(/([a-zA-Z][a-zA-Z0-9-]*)="([^"]*)"/gu)].map(([, attributeName, value]) => [
                toGlyphAttributeName(attributeName),
                value
            ])
        );
        const element = toGlyphElement(iconName, tag, attributes);

        stack.at(-1)?.children?.push(element);

        if (selfClosing !== '/') {
            stack.push(element);
        }
    }

    return root.children ?? [];
};

const readGlyphMarkup = (name: string, weight: 'F' | 'O'): string | undefined =>
    readFileSync(join(REICON_DIR, 'icons', `${name}.js`), 'utf8').match(new RegExp(`\\b${weight}: \`([^\`]*)\``, 'u'))?.[1];

const buildGlyphs = (names: readonly string[], weight: 'F' | 'O'): Record<string, GlyphElement[]> =>
    Object.fromEntries(
        names.map(name => {
            const markup = readGlyphMarkup(name, weight);

            if (!isDefined(markup)) {
                throw new Error(`Missing ${weight} markup for Reicon ${name}`);
            }

            return [`reicon:${name}`, parseGlyphMarkup(name, markup)];
        })
    );

const buildWordIndex = (iconIndex: readonly [string, string][]): Record<string, string> => {
    const wordTranslations = readWordTranslations();
    const words = [...new Set(iconIndex.flatMap(([, keywords]) => keywords.split(/[^a-z]+/u)))].filter(
        word => word.length >= MIN_TRANSLATED_WORD_LENGTH
    );

    return Object.fromEntries(
        words
            .map(word => [word, joinKeywords(wordTranslations.flatMap(translations => translations[word] ?? []))])
            .filter(([, keywords]) => keywords.length > 0)
    );
};

const buildEmojiIndex = (): [string, string][] => {
    const itemsByEmoji = new Map<string, typeof EmojibaseDataSchema.Type>();

    for (const language of EMOJI_LANGUAGES) {
        for (const item of Schema.decodeUnknownSync(EmojibaseDataSchema)(
            JSON.parse(readFileSync(join(EMOJIBASE_DIR, language, 'data.json'), 'utf8'))
        )) {
            if (isDefined(item.group) && item.group !== EMOJI_COMPONENT_GROUP) {
                itemsByEmoji.set(item.emoji, [...(itemsByEmoji.get(item.emoji) ?? []), item]);
            }
        }
    }

    return [...itemsByEmoji].map(([emoji, items]) => [
        emoji,
        joinKeywordSections(
            items.map(item => item.label),
            items.flatMap(item => item.tags ?? [])
        )
    ]);
};

const main = (): void => {
    const names = [...readFileSync(REICON_INDEX_FILE, 'utf8').matchAll(/export \{ (\w+) \} from '\.\/icons\/\1\.js';/gu)]
        .map(match => match[1])
        .sort();
    const legacyMapping = Schema.decodeUnknownSync(StringRecordSchema)(JSON.parse(readFileSync(LEGACY_MAPPING_FILE, 'utf8')));
    const legacyNames = [...readFileSync(join(CONTRACTS_DIR, 'enum', 'user-icon-name.enum.ts'), 'utf8').matchAll(/\w+ = '(\w+)'/gu)]
        .map(match => match[1])
        .sort();

    if (
        !isNotEmptyString(names.join('')) ||
        new Set(names.map(enumKey)).size !== names.length ||
        Object.keys(legacyMapping).sort().join('|') !== legacyNames.join('|') ||
        Object.values(legacyMapping).some(name => !names.includes(name))
    ) {
        process.stderr.write('Invalid Reicon catalog: empty exports, duplicate enum keys, incomplete legacy mapping, or unknown target.\n');
        process.exitCode = 1;

        return;
    }

    const iconIndex = buildIconIndex(names, legacyMapping);

    generateCatalog(names, legacyMapping);

    writeFileSync(GLYPHS_FILE, `${JSON.stringify({ outline: buildGlyphs(names, 'O'), filled: buildGlyphs(FILLED_ICON_NAMES, 'F') })}\n`);

    writeFileSync(
        SEARCH_INDEX_FILE,
        `${JSON.stringify({ icons: [...iconIndex, ...buildEmojiIndex()], translations: buildWordIndex(iconIndex) }, null, 4)}\n`
    );
};

Effect.runSync(Effect.sync(main));
