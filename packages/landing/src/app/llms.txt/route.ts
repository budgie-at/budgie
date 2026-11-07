/* oxlint-disable lingui/no-unlocalized-strings -- plain-text file for crawlers, not rendered UI */
import { ARTICLE_REGISTRY } from '../../blog/constant/article-registry.constant';
import { PILLAR_HUB_REGISTRY } from '../../feature/constant/pillar-hub-registry.constant';
import { BASE_URL, LOCALES } from '../../generic/constant/seo.constant';
import { getI18nInstance } from '../../i18n/app-router-i18n';
import { BLOG_INDEX_METADATA } from '../[lang]/blog/metadata';
import { CHANGELOG_METADATA } from '../[lang]/changelog/metadata';
import { FEATURES_HUB_METADATA } from '../[lang]/features/hub-metadata';
import { FEATURE_METADATA_LIST } from '../[lang]/features/metadata';
import { HOME_PAGE_METADATA } from '../[lang]/metadata';
import sitemap from '../sitemap';

import type { MessageDescriptor } from '@lingui/core';

const SOURCE_LOCALE = 'en';
const GROUPS = ['Overview', 'Topics', 'Features', 'Blog', 'Other'] as const;
const [OVERVIEW, TOPICS, FEATURES, BLOG, OTHER] = GROUPS;

const SUMMARY =
    'Budgie is a privacy-first, offline-first expense tracker for iOS and Android. Your financial data stays on your phone, encrypted, and the app works offline with no account required. Budgie is source-available.';

const buildPageIndex = () => {
    const i18n = getI18nInstance(SOURCE_LOCALE);
    const describe = (group: (typeof GROUPS)[number], title: MessageDescriptor, description: MessageDescriptor) =>
        ({
            group,
            title: i18n._(title),
            description: i18n._(description)
        }) as const;

    return new Map([
        ['', describe(OVERVIEW, HOME_PAGE_METADATA.metaTitle, HOME_PAGE_METADATA.metaDescription)],
        ['/features', describe(OVERVIEW, FEATURES_HUB_METADATA.title, FEATURES_HUB_METADATA.description)],
        ['/blog', describe(OVERVIEW, BLOG_INDEX_METADATA.title, BLOG_INDEX_METADATA.description)],
        ['/changelog', describe(OVERVIEW, CHANGELOG_METADATA.title, CHANGELOG_METADATA.description)],
        ...PILLAR_HUB_REGISTRY.map(entry => [`/${entry.slug}`, describe(TOPICS, entry.title, entry.metaDescription)] as const),
        ...FEATURE_METADATA_LIST.map(entry => [`/features/${entry.slug}`, describe(FEATURES, entry.name, entry.metaDescription)] as const),
        ...ARTICLE_REGISTRY.map(entry => [`/blog/${entry.slug}`, describe(BLOG, entry.title, entry.seoDescription)] as const)
    ]);
};

const buildLlmsTxt = (): string => {
    const pageIndex = buildPageIndex();
    const sourcePrefix = `${BASE_URL}/${SOURCE_LOCALE}`;
    const pages = sitemap()
        .map(entry => entry.url)
        .filter(url => url.startsWith(sourcePrefix))
        .map(url => {
            const page = pageIndex.get(url.slice(sourcePrefix.length));

            return { url, group: page?.group ?? OTHER, title: page?.title ?? url, description: page?.description ?? '' };
        });
    const sections = GROUPS.flatMap(group => {
        const links = pages
            .filter(page => page.group === group)
            .map(page => `- [${page.title}](${page.url})${page.description === '' ? '' : `: ${page.description}`}`);

        return links.length === 0 ? [] : [`### ${group}`, '', ...links, ''];
    });
    const translatedLocales = LOCALES.filter(locale => locale !== SOURCE_LOCALE);
    const languageNames = new Intl.DisplayNames([SOURCE_LOCALE], { type: 'language' });
    const localeHomes = LOCALES.map(locale => `- [${languageNames.of(locale)}](${BASE_URL}/${locale})`);

    return [
        '# Budgie',
        '',
        `> ${SUMMARY}`,
        '',
        'Source code: https://github.com/budgie-at/budgie',
        '',
        '## Sections',
        '',
        ...sections,
        '## Translations',
        '',
        `Every page above also exists under ${new Intl.ListFormat(SOURCE_LOCALE).format(translatedLocales.map(locale => `/${locale}`))} with the same slug as its English page.`,
        '',
        ...localeHomes,
        ''
    ].join('\n');
};

export const GET = () => new Response(buildLlmsTxt(), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
