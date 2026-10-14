import { msg } from '@lingui/core/macro';

import { BreadcrumbsJsonLd } from '../../../generic/component/breadcrumbs-json-ld/breadcrumbs-json-ld';
import { WebPageJsonLd } from '../../../generic/component/web-page-json-ld/web-page-json-ld';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { PILLAR_CLASS_NAME } from '../../constant/pillar-class-name.constant';

import type { PillarHubMetadataInterface } from '../../interface/pillar-hub-metadata.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly lang: string;
    readonly meta: PillarHubMetadataInterface;
    readonly children: ReactNode;
}

export const PillarHubPageShell = ({ lang, meta, children }: Props) => {
    const i18n = getI18nInstance(lang);
    const title = i18n._(meta.metaTitle);

    return (
        <main className={`flex-1 ${PILLAR_CLASS_NAME[meta.pillar]}`}>
            <BreadcrumbsJsonLd locale={lang} path={`/${meta.slug}`}>
                <BreadcrumbsJsonLd.Item name={i18n._(msg`Home`)} path={`/${lang}`} />
                <BreadcrumbsJsonLd.Item name={title} path={`/${lang}/${meta.slug}`} />
            </BreadcrumbsJsonLd>
            <WebPageJsonLd
                description={i18n._(meta.metaDescription)}
                locale={lang}
                path={`/${meta.slug}`}
                publishedAt={meta.publishedAt}
                title={title}
                updatedAt={meta.updatedAt}
            />
            {children}
        </main>
    );
};
