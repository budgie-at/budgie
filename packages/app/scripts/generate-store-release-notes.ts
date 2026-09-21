/* eslint-disable no-console -- CLI script reporting progress to the terminal */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

import { getErrorMessage, isDefined, isEmptyArray, isNotEmptyString } from '@rnw-community/shared';

const appDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRootDirectory = resolve(appDirectory, '..', '..');
const metadataDirectory = join(appDirectory, 'fastlane', 'metadata');
const stateFilePath = join(metadataDirectory, 'release-notes-state.json');

const appStoreCodepointLimit = 3900;
const playCodepointLimit = 490;

const storeNotesModel = process.env['STORE_NOTES_MODEL'] ?? 'claude-opus-5';

const fallbackReleaseNotes = "What's new:\n- Stability and quality improvements.";

const userFacingCommitTypes = new Set(['feat', 'fix', 'perf']);
const userFacingCommitScopes = new Set(['app']);

const nonShippingPathspecs = [
    ':(exclude).agents',
    ':(exclude).claude',
    ':(exclude).github',
    ':(exclude)docs',
    ':(exclude)tests',
    ':(exclude)packages/app/fastlane',
    ':(exclude)packages/app/scripts',
    ':(exclude)*.md'
];

const conventionalCommitPattern = /^(?<type>[a-z]+)(?:\((?<scope>[a-z0-9,-]+)\))?!?:\s*(?<subject>.+)$/i;

const storeLocales = { en: 'en-US', fr: 'fr-FR', uk: 'uk', de: 'de-DE', es: 'es-ES' } as const;

const appLocales = Object.keys(storeLocales) as (keyof typeof storeLocales)[];

const releaseNotesSystemPrompt = `You are the release-notes copywriter for Budgie, an offline-first mobile expenses tracker.

Voice: confident, plain, and human. Lead every locale's copy with the single most user-visible change in this release, then use benefit-led bullet points starting with "-" for the rest. Describe what the change lets the person do or see, never how it is built. Never name a technology, framework, library, database, model, or algorithm, and never mention AI, bots, or automation — write as if a person on the team shipped this update.

The brand name "Budgie" is always written in Latin script, capitalized, unchanged, even inside otherwise non-Latin text.

Match the register speakers expect for each locale: French uses "vous", German uses "du", Spanish uses "tu", Ukrainian uses the informal "ти" form. English uses the natural informal, friendly register a finance app would use.

For every locale, write native-quality, idiomatic copy, never a literal translation from English. Produce two variants per locale:
- "appStore": Apple App Store "What's New" release notes, a hard limit of ${String(appStoreCodepointLimit)} characters, aiming for 600 characters or fewer.
- "play": Google Play changelog, a hard limit of ${String(playCodepointLimit)} characters, written as 3 to 5 short lines.

Respond with JSON only, matching the provided schema exactly.`;

const localeNotesJsonSchema = {
    type: 'object',
    properties: { appStore: { type: 'string' }, play: { type: 'string' } },
    required: ['appStore', 'play'],
    additionalProperties: false
};

const releaseNotesJsonSchema = {
    type: 'object',
    properties: {
        locales: {
            type: 'object',
            properties: Object.fromEntries(appLocales.map(appLocale => [appLocale, localeNotesJsonSchema])),
            required: appLocales,
            additionalProperties: false
        }
    },
    required: ['locales'],
    additionalProperties: false
};

const releaseNotesResponseSchema = z.object({
    locales: z.record(z.enum(appLocales), z.object({ appStore: z.string().trim().min(1), play: z.string().trim().min(1) }))
});

type LocaleReleaseNotes = z.infer<typeof releaseNotesResponseSchema>['locales'];

const releaseNotesStateSchema = z.object({ generatedAtCommit: z.string(), generatedFor: z.string() });

const appPackageJsonSchema = z.object({ version: z.string().min(1) });

function runGit(args: string[]): string {
    return execFileSync('git', args, { cwd: repositoryRootDirectory, encoding: 'utf8' }).trim();
}

function getPreviousTag(latestTag: string): string | undefined {
    const sortedTags = runGit(['tag', '--list', 'v*', '--sort=-v:refname']).split('\n').filter(isNotEmptyString);

    const latestTagIndex = sortedTags.indexOf(latestTag);

    return latestTagIndex < 0 ? undefined : sortedTags[latestTagIndex + 1];
}

function getCommitSubjects(baseRef: string | undefined, headRef: string): string[] {
    const range = isDefined(baseRef) ? `${baseRef}..${headRef}` : headRef;

    return runGit(['log', range, '--pretty=%s', '--', '.', ...nonShippingPathspecs])
        .split('\n')
        .filter(isNotEmptyString);
}

function getReleaseNoteBullets(commitSubjects: string[]): string[] {
    const bullets = new Map<string, string>();

    for (const commitSubject of commitSubjects) {
        const groups = conventionalCommitPattern.exec(commitSubject)?.groups;

        if (!isDefined(groups) || !userFacingCommitTypes.has(groups['type'].toLowerCase())) {
            continue;
        }

        const scopeSegments = groups['scope']?.toLowerCase().split(',') ?? [];

        if (!scopeSegments.every(scopeSegment => userFacingCommitScopes.has(scopeSegment))) {
            continue;
        }

        const subject = groups['subject'].trim();

        if (isNotEmptyString(subject)) {
            bullets.set(subject.toLowerCase(), subject.charAt(0).toUpperCase() + subject.slice(1));
        }
    }

    return [...bullets.values()];
}

function trimToLimit(text: string, codepointLimit: number): string {
    const codepoints = [...text];

    if (codepoints.length <= codepointLimit) {
        return text;
    }

    const truncatedText = codepoints.slice(0, codepointLimit).join('');
    const lastLineBreakIndex = truncatedText.lastIndexOf('\n');

    return truncatedText.slice(0, lastLineBreakIndex > 0 ? lastLineBreakIndex : truncatedText.length).trimEnd();
}

function writeStoreNotesFile(filePath: string, content: string): void {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, content, 'utf8');
    console.log(`  ${filePath}`);
}

function writeStoreNotes(storeLocale: string, appStore: string, play: string): void {
    writeStoreNotesFile(join(metadataDirectory, 'ios', storeLocale, 'release_notes.txt'), trimToLimit(appStore, appStoreCodepointLimit));
    writeStoreNotesFile(
        join(metadataDirectory, 'android', storeLocale, 'changelogs', 'default.txt'),
        trimToLimit(play, playCodepointLimit)
    );
}

async function generateLocalizedReleaseNotes(bullets: string[], version: string): Promise<LocaleReleaseNotes> {
    const commitList = isEmptyArray(bullets)
        ? '(No user-facing changes were recorded for this release; write stability and quality improvement copy.)'
        : bullets.map(bullet => `- ${bullet}`).join('\n');
    const stream = new Anthropic().beta.messages.stream({
        model: storeNotesModel,
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: releaseNotesSystemPrompt,
        messages: [
            {
                role: 'user',
                content: `Budgie version ${version} is releasing with these user-facing changes:\n${commitList}\n\nWrite both variants for every one of these locales: ${appLocales.join(', ')}.`
            }
        ],
        output_config: { format: { type: 'json_schema', schema: releaseNotesJsonSchema } }
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === 'refusal') {
        throw new Error('Claude refused to generate localized store release notes.');
    }

    const responseText = message.content.map(block => (block.type === 'text' ? block.text : '')).join('');

    return releaseNotesResponseSchema.parse(JSON.parse(responseText)).locales;
}

function writeFallbackEnglishReleaseNotes(bullets: string[]): void {
    writeStoreNotes(storeLocales.en, fallbackReleaseNotes, fallbackReleaseNotes);

    if (!isEmptyArray(bullets)) {
        console.warn('Commit subjects are developer copy and are never published. Write the English notes by hand from:');

        for (const bullet of bullets) {
            console.warn(`  - ${bullet}`);
        }
    }

    console.warn('Locale release notes still hold the previous release copy and need a human/agent translation:');

    for (const appLocale of appLocales.filter(locale => locale !== 'en')) {
        const filePath = join(metadataDirectory, 'ios', storeLocales[appLocale], 'release_notes.txt');

        console.warn(`  ${appLocale}: ${existsSync(filePath) ? statSync(filePath).mtime.toISOString() : 'missing'}`);
    }
}

function checkReleaseNotesFreshness(): void {
    if (!existsSync(stateFilePath)) {
        console.log(
            'Store release notes have never been generated in this branch. Run "pnpm store:notes" from packages/app and commit the result.'
        );

        return;
    }

    try {
        const state = releaseNotesStateSchema.parse(JSON.parse(readFileSync(stateFilePath, 'utf8')));
        const unreflectedBullets = getReleaseNoteBullets(getCommitSubjects(state.generatedAtCommit, 'HEAD'));

        if (isEmptyArray(unreflectedBullets)) {
            console.log(`Store release notes are fresh (generated for ${state.generatedFor} at ${state.generatedAtCommit}).`);

            return;
        }

        console.log(
            `Store release notes may be stale, ${String(unreflectedBullets.length)} user-facing commits landed after generation for ${state.generatedFor}:`
        );

        for (const unreflectedBullet of unreflectedBullets) {
            console.log(`  - ${unreflectedBullet}`);
        }
    } catch (error) {
        console.log(
            `Store release notes state is unusable; regenerate with "pnpm store:notes" from packages/app. (${getErrorMessage(error)})`
        );
    }
}

async function main(): Promise<void> {
    if (process.argv.includes('--check')) {
        checkReleaseNotesFreshness();

        return;
    }

    const latestTag = runGit(['describe', '--tags', '--match', 'v*', '--abbrev=0']);
    const headCommit = runGit(['rev-parse', 'HEAD']);
    const isPendingRelease = headCommit !== runGit(['rev-list', '-n1', latestTag]);
    const baseRef = isPendingRelease ? latestTag : getPreviousTag(latestTag);
    const headRef = isPendingRelease ? 'HEAD' : latestTag;
    const bullets = getReleaseNoteBullets(getCommitSubjects(baseRef, headRef));
    const version = appPackageJsonSchema.parse(JSON.parse(readFileSync(join(appDirectory, 'package.json'), 'utf8'))).version;

    console.log(`Generating store release notes for version ${version} from ${baseRef ?? '(initial commit)'}..${headRef}`);

    const localeNotes = isNotEmptyString(process.env['ANTHROPIC_API_KEY'])
        ? await generateLocalizedReleaseNotes(bullets, version).catch((error: unknown) => {
              console.warn(`Falling back to plain English store release notes: ${getErrorMessage(error)}`);

              return null;
          })
        : null;

    if (isDefined(localeNotes)) {
        console.log(`Wrote localized copy from ${storeNotesModel}:`);

        for (const appLocale of appLocales) {
            writeStoreNotes(storeLocales[appLocale], localeNotes[appLocale].appStore, localeNotes[appLocale].play);
        }
    } else {
        writeFallbackEnglishReleaseNotes(bullets);
    }

    writeFileSync(stateFilePath, `${JSON.stringify({ generatedAtCommit: headCommit, generatedFor: version }, undefined, 4)}\n`, 'utf8');
    console.log(`  ${stateFilePath}`);
}

main().catch((error: unknown) => {
    console.error(getErrorMessage(error));
    process.exitCode = 1;
});
