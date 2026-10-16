import Link from 'next/link';

import { AppShot } from '../../../generic/component/app-shot/app-shot';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { PILLAR_CLASS_NAME } from '../../constant/pillar-class-name.constant';
import { PILLAR_LABEL } from '../../constant/pillar-label.constant';

import type { FeatureRegistryEntryInterface } from '../../interface/feature-registry-entry.interface';

interface Props {
    readonly feature: FeatureRegistryEntryInterface;
    readonly locale: string;
    readonly scene: string;
}

export const FeatureRelatedCard = ({ feature, locale, scene }: Props) => {
    const i18n = getI18nInstance(locale);

    return (
        <Link className={`feature-related-card ${PILLAR_CLASS_NAME[feature.pillar]}`} href={`/${locale}/features/${feature.slug}`}>
            <div aria-hidden className="feature-related-thumb">
                <div className="feature-related-phone">
                    <AppShot alt="" locale={locale} scene={scene} sizes="13rem" slug={feature.slug} />
                </div>
            </div>
            <div className="feature-related-body">
                <span className="feature-related-kicker">{i18n._(PILLAR_LABEL[feature.pillar])}</span>
                <h3 className="feature-related-title">{i18n._(feature.name)}</h3>
                <p className="feature-related-line">{i18n._(feature.tagline)}</p>
            </div>
        </Link>
    );
};
