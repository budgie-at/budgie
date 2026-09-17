/* eslint-disable no-console */
// Generates App Store and Play Store release notes from the conventional-commit log.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const appDirectory = resolve(scriptDirectory, '..');
const repositoryRootDirectory = resolve(appDirectory, '..', '..');
const metadataDirectory = join(appDirectory, 'fastlane', 'metadata');

const iosReleaseNotesCharacterLimit = 4000;
const androidChangelogCharacterLimit = 500;
const appStoreNotesCodepointLimit = 3900;
const playChangelogCodepointLimit = 490;

const storeNotesModel = process.env['STORE_NOTES_MODEL'] ?? 'claude-opus-5';
const releaseNotesMaxTokens = 16000;

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

const conventionalCommitPattern = /^(?<type>[a-z]+)(?:\((?<scope>[a-z0-9,-]+)\))?(?<breaking>!)?:\s*(?<subject>.+)$/i;

interface LocaleStoreFolder {
    readonly appLocale: string;
    readonly storeLocale: string;
}

const localeStoreFolders: LocaleStoreFolder[] = [
    { appLocale: 'en', storeLocale: 'en-US' },
    { appLocale: 'fr', storeLocale: 'fr-FR' },
    { appLocale: 'uk', storeLocale: 'uk' },
    { appLocale: 'de', storeLocale: 'de-DE' },
    { appLocale: 'es', storeLocale: 'es-ES' }
];

const appLocales = localeStoreFolders.map(({ appLocale }) => appLocale);

const releaseNotesSystemPrompt = `You are the release-notes copywriter for Budgie, an offline-first mobile expenses tracker.

Voice: confident, plain, and human. Lead every locale's copy with the single most user-visible change in this release, then use benefit-led bullet points starting with "-" for the rest. Describe what the change lets the person do or see, never how it is built. Never name a technology, framework, library, database, model, or algorithm, and never mention AI, bots, or automation — write as if a person on the team shipped this update.

The brand name "Budgie" is always written in Latin script, capitalized, unchanged, even inside otherwise non-Latin text.

Match the register speakers expect for each locale: French uses "vous", German uses "du", Spanish uses "tu", Ukrainian uses the informal "ти" form. English uses the natural informal, friendly register a finance app would use.

For every locale, write native-quality, idiomatic copy, never a literal translation from English. Produce two variants per locale:
- "appStore": Apple App Store "What's New" release notes, aiming for 600 characters or fewer.
- "play": Google Play changelog, a hard limit of 490 characters, written as 3 to 5 short lines.

Respond with JSON only, matching the provided schema exactly.`;

function runGit(args: string[]): string {
    return execFileSync('git', args, { cwd: repositoryRootDirectory, encoding: 'utf8' }).trim();
}

function getLatestTag(): string {
    return runGit(['describe', '--tags', '--match', 'v*', '--abbrev=0']);
}

function getHeadCommit(): string {
    return runGit(['rev-parse', 'HEAD']);
}

function getTagCommit(tag: string): string {
    return runGit(['rev-list', '-n1', tag]);
}

function getPreviousTag(latestTag: string): string | undefined {
    const sortedTags = runGit(['tag', '--list', 'v*', '--sort=-v:refname'])
        .split('\n')
        .filter(tag => tag.length > 0);
    const latestTagIndex = sortedTags.indexOf(latestTag);
    const hasPreviousTag = latestTagIndex >= 0 && latestTagIndex + 1 < sortedTags.length;

    return hasPreviousTag ? sortedTags[latestTagIndex + 1] : undefined;
}

const appPackageJsonSchema = z.object({ version: z.string().min(1) });

function readAppVersion(): string {
    const appPackageJsonPath = join(appDirectory, 'package.json');
    const appPackageJsonContents: unknown = JSON.parse(readFileSync(appPackageJsonPath, 'utf8'));

    return appPackageJsonSchema.parse(appPackageJsonContents).version;
}

function getCommitSubjects(baseRef: string | undefined, headRef: string): string[] {
    const range = baseRef === undefined ? headRef : `${baseRef}..${headRef}`;
    const log = runGit(['log', range, '--pretty=%s', '--', '.', ...nonShippingPathspecs]);

    return log.length === 0 ? [] : log.split('\n');
}

interface ConventionalCommitGroups {
    readonly type: string;
    readonly scope: string | undefined;
    readonly subject: string;
}

function isUserFacingCommit(commitGroups: ConventionalCommitGroups): boolean {
    const { type, scope } = commitGroups;

    if (!userFacingCommitTypes.has(type.toLowerCase())) {
        return false;
    }

    if (scope === undefined) {
        return true;
    }

    return scope
        .toLowerCase()
        .split(',')
        .every(scopeSegment => userFacingCommitScopes.has(scopeSegment));
}

function toSentenceCase(text: string): string {
    const trimmedText = text.trim();

    return trimmedText.length === 0 ? trimmedText : trimmedText.charAt(0).toUpperCase() + trimmedText.slice(1);
}

function getReleaseNoteBullets(commitSubjects: string[]): string[] {
    const seenNormalizedBullets = new Set<string>();
    const bullets: string[] = [];

    for (const commitSubject of commitSubjects) {
        const commitMatch = conventionalCommitPattern.exec(commitSubject);

        if (commitMatch === null || commitMatch.groups === undefined) {
            continue;
        }

        const commitGroups: ConventionalCommitGroups = {
            type: commitMatch.groups['type'],
            scope: commitMatch.groups['scope'],
            subject: commitMatch.groups['subject']
        };

        if (!isUserFacingCommit(commitGroups)) {
            continue;
        }

        const bullet = toSentenceCase(commitGroups.subject);
        const normalizedBullet = bullet.toLowerCase();

        if (bullet.length === 0 || seenNormalizedBullets.has(normalizedBullet)) {
            continue;
        }

        seenNormalizedBullets.add(normalizedBullet);
        bullets.push(bullet);
    }

    return bullets;
}

function renderReleaseNotes(bullets: string[]): string {
    if (bullets.length === 0) {
        return "What's new:\n- Stability and quality improvements.";
    }

    return ["What's new:", ...bullets.map(bullet => `- ${bullet}`)].join('\n');
}

function trimToCharacterLimit(text: string, characterLimit: number): string {
    return text.length <= characterLimit ? text : text.slice(0, characterLimit);
}

function trimToLineBoundary(text: string, characterLimit: number): string {
    if (text.length <= characterLimit) {
        return text;
    }

    const truncatedText = text.slice(0, characterLimit);
    const lastLineBreakIndex = truncatedText.lastIndexOf('\n');
    const boundaryIndex = lastLineBreakIndex > 0 ? lastLineBreakIndex : characterLimit;

    return truncatedText.slice(0, boundaryIndex).trimEnd();
}

function getCodepointLength(text: string): number {
    return [...text].length;
}

function trimToCodepointLineBoundary(text: string, codepointLimit: number): string {
    const codepoints = [...text];

    if (codepoints.length <= codepointLimit) {
        return text;
    }

    const truncatedText = codepoints.slice(0, codepointLimit).join('');
    const lastLineBreakIndex = truncatedText.lastIndexOf('\n');
    const boundaryIndex = lastLineBreakIndex > 0 ? lastLineBreakIndex : truncatedText.length;

    return truncatedText.slice(0, boundaryIndex).trimEnd();
}

function writeReleaseNotesFile(filePath: string, content: string): void {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, content, 'utf8');
}

function getIosReleaseNotesPath(storeLocale: string): string {
    return join(metadataDirectory, 'ios', storeLocale, 'release_notes.txt');
}

function getAndroidChangelogPath(storeLocale: string): string {
    return join(metadataDirectory, 'android', storeLocale, 'changelogs', 'default.txt');
}

function describeLocaleReleaseNotesFile(filePath: string): string {
    return existsSync(filePath)
        ? `${filePath} (last modified ${statSync(filePath).mtime.toISOString()})`
        : `${filePath} (missing, needs a first translation)`;
}

function reportStaleLocaleReleaseNotes(): void {
    const staleFilePaths = localeStoreFolders
        .filter(({ appLocale }) => appLocale !== 'en')
        .flatMap(({ storeLocale }) => [getIosReleaseNotesPath(storeLocale), getAndroidChangelogPath(storeLocale)]);

    if (staleFilePaths.length === 0) {
        return;
    }

    const staleFileEntries = staleFilePaths.map(describeLocaleReleaseNotesFile);

    console.warn('Locale release notes need a human/agent translation of the refreshed en-US copy:');

    for (const staleFileEntry of staleFileEntries) {
        console.warn(`  ${staleFileEntry}`);
    }
}

function buildReleaseNotesSchema(): Record<string, unknown> {
    const localeReleaseNotesSchema = {
        type: 'object',
        properties: {
            appStore: { type: 'string' },
            play: { type: 'string' }
        },
        required: ['appStore', 'play'],
        additionalProperties: false
    };

    return {
        type: 'object',
        properties: {
            locales: {
                type: 'object',
                properties: Object.fromEntries(appLocales.map(appLocale => [appLocale, localeReleaseNotesSchema])),
                required: appLocales,
                additionalProperties: false
            }
        },
        required: ['locales'],
        additionalProperties: false
    };
}

function buildReleaseNotesUserPrompt(bullets: string[], version: string): string {
    const commitList =
        bullets.length === 0
            ? '(No user-facing changes were recorded for this release; write stability and quality improvement copy.)'
            : bullets.map(bullet => `- ${bullet}`).join('\n');

    return [
        `Budgie version ${version} is releasing with these user-facing changes:`,
        commitList,
        '',
        `Write release notes for every one of these ${String(appLocales.length)} app locales: ${appLocales.join(', ')}.`,
        'For each locale write two variants:',
        '- "appStore": Apple App Store "What\'s New" release notes, aiming for 600 characters or fewer.',
        '- "play": Google Play changelog, a hard limit of 490 characters, written as 3 to 5 short lines.',
        'Write native-quality, idiomatic copy for each locale, never a literal translation from English.',
        'Never name a technology, framework, or implementation detail; describe outcomes only.',
        'Respond with JSON only, matching the provided schema exactly.'
    ].join('\n');
}

interface LengthViolation {
    readonly appLocale: string;
    readonly field: 'appStore' | 'play';
    readonly limit: number;
    readonly length: number;
}

function buildShortenRetryPrompt(originalUserPrompt: string, violations: LengthViolation[]): string {
    const violationLines = violations.map(
        ({ appLocale, field, limit, length }) =>
            `- locale "${appLocale}", field "${field}": ${String(length)} characters, must be ${String(limit)} characters or fewer`
    );

    return [
        originalUserPrompt,
        '',
        'Your previous response exceeded the required limits on these fields:',
        ...violationLines,
        '',
        `Return the complete JSON again for all ${String(appLocales.length)} locales, matching the schema exactly, with only the fields listed above shortened to fit their limits. Keep every other field as strong as before.`
    ].join('\n');
}

const localeReleaseNotesResponseSchema = z.object({
    locales: z.object(
        Object.fromEntries(
            appLocales.map(appLocale => [appLocale, z.object({ appStore: z.string().trim().min(1), play: z.string().trim().min(1) })])
        )
    )
});

type LocaleReleaseNotesMap = z.infer<typeof localeReleaseNotesResponseSchema>['locales'];

interface LocaleReleaseNotes {
    readonly appStore: string;
    readonly play: string;
}

const releaseNotesStateSchema = z.object({
    baseRef: z.string(),
    generatedAtCommit: z.string(),
    generatedFor: z.string()
});

type ReleaseNotesState = z.infer<typeof releaseNotesStateSchema>;

function getReleaseNotesStatePath(): string {
    return join(metadataDirectory, 'release-notes-state.json');
}

function writeReleaseNotesState(state: ReleaseNotesState): void {
    const stateFilePath = getReleaseNotesStatePath();

    writeFileSync(stateFilePath, `${JSON.stringify(state, undefined, 4)}\n`, 'utf8');
    console.log(`  ${stateFilePath}`);
}

function checkReleaseNotesFreshness(): void {
    const stateFilePath = getReleaseNotesStatePath();

    if (!existsSync(stateFilePath)) {
        console.log(
            `Store release notes have never been generated in this branch. Run "pnpm store:notes" from packages/app and commit the result (expected state file: ${stateFilePath}).`
        );

        return;
    }

    let state: ReleaseNotesState;

    try {
        const stateFileContents: unknown = JSON.parse(readFileSync(stateFilePath, 'utf8'));
        state = releaseNotesStateSchema.parse(stateFileContents);
    } catch (error) {
        console.log(
            `Store release notes state file is invalid; regenerate with "pnpm store:notes" from packages/app. (${getErrorMessage(error)})`
        );

        return;
    }

    let commitSubjectsSinceGeneration: string[] = [];

    try {
        commitSubjectsSinceGeneration = getCommitSubjects(state.generatedAtCommit, 'HEAD');
    } catch (error) {
        console.log(
            `Store release notes state points at unknown commit ${state.generatedAtCommit}; regenerate with "pnpm store:notes" from packages/app. (${getErrorMessage(error)})`
        );

        return;
    }

    const unreflectedBullets = getReleaseNoteBullets(commitSubjectsSinceGeneration);

    if (unreflectedBullets.length === 0) {
        console.log(`Store release notes are fresh (generated for ${state.generatedFor} at ${state.generatedAtCommit}).`);

        return;
    }

    console.log(
        `Store release notes may be stale: ${String(unreflectedBullets.length)} user-facing commits landed after generation for ${state.generatedFor}.`
    );

    for (const unreflectedBullet of unreflectedBullets) {
        console.log(`  - ${unreflectedBullet}`);
    }
}

async function requestReleaseNotesCompletion(
    client: Anthropic,
    schema: Record<string, unknown>,
    userPrompt: string
): Promise<Anthropic.Beta.BetaMessage> {
    const stream = client.beta.messages.stream({
        model: storeNotesModel,
        max_tokens: releaseNotesMaxTokens,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: releaseNotesSystemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        output_config: { format: { type: 'json_schema', schema } }
    });

    return stream.finalMessage();
}

function isTextContentBlock(block: Anthropic.Beta.BetaContentBlock): block is Anthropic.Beta.BetaTextBlock {
    return block.type === 'text';
}

function parseReleaseNotesMessage(message: Anthropic.Beta.BetaMessage): LocaleReleaseNotesMap {
    const responseText = message.content
        .filter(isTextContentBlock)
        .map(block => block.text)
        .join('');
    const responseJson: unknown = JSON.parse(responseText);

    return localeReleaseNotesResponseSchema.parse(responseJson).locales;
}

function findLengthViolations(localeNotes: LocaleReleaseNotesMap): LengthViolation[] {
    const violations: LengthViolation[] = [];

    for (const appLocale of appLocales) {
        const notes = localeNotes[appLocale];
        const appStoreLength = getCodepointLength(notes.appStore);
        const playLength = getCodepointLength(notes.play);

        if (appStoreLength > appStoreNotesCodepointLimit) {
            violations.push({ appLocale, field: 'appStore', limit: appStoreNotesCodepointLimit, length: appStoreLength });
        }

        if (playLength > playChangelogCodepointLimit) {
            violations.push({ appLocale, field: 'play', limit: playChangelogCodepointLimit, length: playLength });
        }
    }

    return violations;
}

function truncateLocaleNotesToLimits(localeNotes: LocaleReleaseNotesMap): Record<string, LocaleReleaseNotes> {
    return Object.fromEntries(
        appLocales.map(appLocale => {
            const notes = localeNotes[appLocale];

            return [
                appLocale,
                {
                    appStore: trimToCodepointLineBoundary(notes.appStore, appStoreNotesCodepointLimit),
                    play: trimToCodepointLineBoundary(notes.play, playChangelogCodepointLimit)
                }
            ];
        })
    );
}

async function generateLocalizedReleaseNotesWithClaude(bullets: string[], version: string): Promise<Record<string, LocaleReleaseNotes>> {
    const client = new Anthropic();
    const schema = buildReleaseNotesSchema();
    const userPrompt = buildReleaseNotesUserPrompt(bullets, version);
    const message = await requestReleaseNotesCompletion(client, schema, userPrompt);

    if (message.stop_reason === 'refusal') {
        throw new Error('Claude refused to generate localized store release notes.');
    }

    const localeNotes = parseReleaseNotesMessage(message);
    const violations = findLengthViolations(localeNotes);

    if (violations.length === 0) {
        return localeNotes;
    }

    const retryPrompt = buildShortenRetryPrompt(userPrompt, violations);
    const retryMessage = await requestReleaseNotesCompletion(client, schema, retryPrompt);

    if (retryMessage.stop_reason === 'refusal') {
        return truncateLocaleNotesToLimits(localeNotes);
    }

    const retriedLocaleNotes = parseReleaseNotesMessage(retryMessage);
    const retryViolations = findLengthViolations(retriedLocaleNotes);

    return retryViolations.length === 0 ? retriedLocaleNotes : truncateLocaleNotesToLimits(retriedLocaleNotes);
}

function writeLocalizedReleaseNotesFiles(localeNotes: Record<string, LocaleReleaseNotes>): string[] {
    const writtenFilePaths: string[] = [];

    for (const { appLocale, storeLocale } of localeStoreFolders) {
        const notes = localeNotes[appLocale];
        const iosReleaseNotesPath = getIosReleaseNotesPath(storeLocale);
        const androidChangelogPath = getAndroidChangelogPath(storeLocale);

        writeReleaseNotesFile(iosReleaseNotesPath, notes.appStore);
        writeReleaseNotesFile(androidChangelogPath, notes.play);
        writtenFilePaths.push(iosReleaseNotesPath, androidChangelogPath);
    }

    return writtenFilePaths;
}

async function generateLocalizedStoreReleaseNotes(bullets: string[], version: string): Promise<void> {
    const localeNotes = await generateLocalizedReleaseNotesWithClaude(bullets, version);
    const writtenFilePaths = writeLocalizedReleaseNotesFiles(localeNotes);

    console.log(`Generated LLM-written localized store release notes for version ${version} using ${storeNotesModel}.`);

    for (const writtenFilePath of writtenFilePaths) {
        console.log(`  ${writtenFilePath}`);
    }
}

function generateFallbackEnglishStoreReleaseNotes(bullets: string[], baseRef: string | undefined, headRef: string): void {
    const releaseNotes = renderReleaseNotes(bullets);
    const iosReleaseNotesPath = getIosReleaseNotesPath('en-US');
    const androidChangelogPath = getAndroidChangelogPath('en-US');

    writeReleaseNotesFile(iosReleaseNotesPath, trimToCharacterLimit(releaseNotes, iosReleaseNotesCharacterLimit));
    writeReleaseNotesFile(androidChangelogPath, trimToLineBoundary(releaseNotes, androidChangelogCharacterLimit));

    console.log(`Generated store release notes from ${baseRef ?? '(initial commit)'}..${headRef}`);
    console.log(`  ${iosReleaseNotesPath}`);
    console.log(`  ${androidChangelogPath}`);

    reportStaleLocaleReleaseNotes();
}

async function main(): Promise<void> {
    if (process.argv.includes('--check')) {
        checkReleaseNotesFreshness();

        return;
    }

    const latestTag = getLatestTag();
    const headCommit = getHeadCommit();
    const isPendingRelease = headCommit !== getTagCommit(latestTag);
    const previousTag = getPreviousTag(latestTag);
    const baseRef = isPendingRelease ? latestTag : previousTag;
    const headRef = isPendingRelease ? 'HEAD' : latestTag;
    const commitSubjects = getCommitSubjects(baseRef, headRef);
    const bullets = getReleaseNoteBullets(commitSubjects);
    const version = readAppVersion();

    let hasGeneratedNotes = false;

    if (isNotEmptyString(process.env['ANTHROPIC_API_KEY'])) {
        try {
            await generateLocalizedStoreReleaseNotes(bullets, version);
            hasGeneratedNotes = true;
        } catch (error) {
            console.warn(`Falling back to plain English store release notes: ${getErrorMessage(error)}`);
        }
    }

    if (!hasGeneratedNotes) {
        generateFallbackEnglishStoreReleaseNotes(bullets, baseRef, headRef);
    }

    writeReleaseNotesState({
        baseRef: baseRef ?? '(initial commit)',
        generatedAtCommit: headCommit,
        generatedFor: version
    });
}

main().catch((error: unknown) => {
    console.error(getErrorMessage(error));
    process.exitCode = 1;
});
