import { AppShot } from '../../../generic/component/app-shot/app-shot';
import { FeatureHeroFocusEnum } from '../../enum/feature-hero-focus.enum';

interface Props {
    readonly slug: string;
    readonly scene: string;
    readonly locale: string;
    readonly alt: string;
    readonly focus?: FeatureHeroFocusEnum;
}

export const FeaturePageHeroShot = ({ slug, scene, locale, alt, focus = FeatureHeroFocusEnum.TOP }: Props) => (
    <figure className="feature-hero-media" data-focus={focus}>
        <div className="feature-hero-phone">
            <AppShot alt={alt} locale={locale} priority scene={scene} sizes="(min-width: 960px) 19.5rem, 14.5rem" slug={slug} />
        </div>
    </figure>
);
