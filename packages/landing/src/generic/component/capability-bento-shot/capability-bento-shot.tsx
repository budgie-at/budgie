import { cn } from 'cn';

import { AppShot } from '../app-shot/app-shot';

interface Props {
    readonly slug: string;
    readonly scene: string;
    readonly locale: string;
    readonly alt: string;
    readonly sizes: string;
    readonly className: string;
}

export const CapabilityBentoShot = ({ slug, scene, locale, alt, sizes, className }: Props) => (
    <div className={cn('bento-shot', className)}>
        <div className="bento-shot-inner">
            <AppShot alt={alt} locale={locale} scene={scene} sizes={sizes} slug={slug} />
        </div>
    </div>
);
