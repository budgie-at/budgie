import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
const ICONS_DIR = join(APP_DIR, 'src', '@generic', 'constant', 'icons');
const CONTRACTS_DIR = resolve(APP_DIR, '../contracts/src/@generic');
const REICON_INDEX_FILE = join(APP_DIR, 'node_modules', 'reicon-react-native', 'index.d.ts');
const ICON_CHUNK_SIZE = 240;
const EMOJI_LANGUAGES = ['en', 'uk', 'de', 'es', 'fr'];
const EMOJI_COMPONENT_GROUP = 2;
const MIN_TRANSLATED_WORD_LENGTH = 3;
const StringArrayRecordSchema = Schema.Record(Schema.String, Schema.Array(Schema.String));
const StringRecordSchema = Schema.Record(Schema.String, Schema.String);

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

    mkdirSync(ICONS_DIR, { recursive: true });

    for (const fileName of readdirSync(ICONS_DIR).filter(name => name.endsWith('.constant.ts'))) {
        rmSync(join(ICONS_DIR, fileName));
    }

    const chunkNames: string[] = [];

    for (let offset = 0; offset < names.length; offset += ICON_CHUNK_SIZE) {
        const chunkName = `icons-${String(chunkNames.length + 1).padStart(3, '0')}`;
        const exportName = `ICON_IMPORTS_CHUNK_${chunkNames.length + 1}`;
        const imports = names
            .slice(offset, offset + ICON_CHUNK_SIZE)
            .map(name => `    'reicon:${name}': () => import('reicon-react-native/icons/${name}')`);

        chunkNames.push(chunkName);
        writeFileSync(
            join(ICONS_DIR, `${chunkName}.constant.ts`),
            `import type { ReiconModuleInterface } from '../../interface/reicon-module.interface';\nimport type { ReiconIconNameEnum } from '@budgie/contracts';\n\nexport const ${exportName} = {\n${imports.join(',\n')}\n} satisfies Partial<Record<ReiconIconNameEnum, () => Promise<ReiconModuleInterface>>>;\n`
        );
    }

    writeFileSync(
        join(APP_DIR, 'src/@generic/constant/icons.constant.ts'),
        `${chunkNames.map((name, index) => `import { ICON_IMPORTS_CHUNK_${index + 1} } from './icons/${name}.constant';`).join('\n')}\n\nimport type { ReiconModuleInterface } from '../interface/reicon-module.interface';\nimport type { ReiconIconNameEnum } from '@budgie/contracts';\n\nexport const ICON_IMPORTS: Record<ReiconIconNameEnum, () => Promise<ReiconModuleInterface>> = {\n${chunkNames.map((_, index) => `    ...ICON_IMPORTS_CHUNK_${index + 1}`).join(',\n')}\n};\n`
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

    writeFileSync(
        SEARCH_INDEX_FILE,
        `${JSON.stringify({ icons: [...iconIndex, ...buildEmojiIndex()], translations: buildWordIndex(iconIndex) }, null, 4)}\n`
    );
};

Effect.runSync(Effect.sync(main));
