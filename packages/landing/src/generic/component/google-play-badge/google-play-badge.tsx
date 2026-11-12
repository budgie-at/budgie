import { useLingui } from '@lingui/react/macro';
import Image from 'next/image';

interface Props {
    readonly lang: string;
}

export const GooglePlayBadge = ({ lang }: Props) => {
    const { t } = useLingui();
    const badgeLang = lang === 'uk' ? 'en' : lang;

    return (
        <a
            className="inline-block"
            href={`https://play.google.com/store/apps/details?id=com.vitaliiyehorov.budgie&hl=${lang}`}
            rel="noopener"
            target="_blank"
        >
            <Image
                alt={t`Get it on Google Play`}
                className="h-16 w-auto"
                height={63}
                src={`/badges/google-play/${badgeLang}.png`}
                width={162}
            />
        </a>
    );
};
