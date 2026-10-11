/* eslint-disable no-console */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as Schema from 'effect/Schema';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { normalizeIconSearchText } from '../src/@generic/utils/normalize-icon-search-text.util.ts';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(SCRIPT_DIR, '..');
const SEARCH_INDEX_FILE = join(APP_DIR, 'src', '@generic', 'constant', 'icon-search-index.json');
const EMOJIBASE_DIR = join(APP_DIR, 'node_modules', 'emojibase-data');
const KEYWORDS_DIR = join(SCRIPT_DIR, 'icon-keywords');
const EXTRA_TAGS_FILE = join(SCRIPT_DIR, 'icon-tags.json');
const EMOJI_LANGUAGES = ['en', 'uk', 'ru', 'de', 'es', 'fr'];
const EMOJI_COMPONENT_GROUP = 2;
const MIN_TRANSLATED_WORD_LENGTH = 3;
const ICON_NAME_PATTERN = /^[A-Z][A-Za-z0-9]*$/u;

const SearchIndexSchema = Schema.Struct({ icons: Schema.Array(Schema.Tuple([Schema.String, Schema.String])) });

const StringArrayRecordSchema = Schema.Record(Schema.String, Schema.Array(Schema.String));

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
                  console.log(`Using word translations ${fileName}`);

                  return Schema.decodeUnknownSync(StringArrayRecordSchema)(JSON.parse(readFileSync(join(KEYWORDS_DIR, fileName), 'utf8')));
              })
        : [];

const splitKeywordSection = (section: string): string[] => section.split('|').filter(isNotEmptyString);

const buildIconKeywords = (existingKeywords: string, extraTags: readonly string[]): string => {
    const [existingNameKeywords = '', existingOtherKeywords = ''] = existingKeywords.split('||');

    return joinKeywordSections(splitKeywordSection(existingNameKeywords), [...splitKeywordSection(existingOtherKeywords), ...extraTags]);
};

const buildIconIndex = (): [string, string][] => {
    const extraTagsByName = Schema.decodeUnknownSync(StringArrayRecordSchema)(JSON.parse(readFileSync(EXTRA_TAGS_FILE, 'utf8')));
    const { icons } = Schema.decodeUnknownSync(SearchIndexSchema)(JSON.parse(readFileSync(SEARCH_INDEX_FILE, 'utf8')));

    return icons
        .filter(([name]) => ICON_NAME_PATTERN.test(name))
        .map(([name, keywords]) => [name, buildIconKeywords(keywords, extraTagsByName[name] ?? [])]);
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
    const iconIndex = buildIconIndex();

    writeFileSync(
        SEARCH_INDEX_FILE,
        `${JSON.stringify({ icons: [...iconIndex, ...buildEmojiIndex()], translations: buildWordIndex(iconIndex) }, null, 4)}\n`
    );

    console.log(`  ${SEARCH_INDEX_FILE}`);
};

main();
