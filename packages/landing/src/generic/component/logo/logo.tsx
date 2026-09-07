import { useLingui } from '@lingui/react/macro';
import Image from 'next/image';

export const Logo = () => {
    const { t } = useLingui();

    return (
        <div className="size-8 rounded-lg bg-linear-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground">
            <Image alt={t`Budgie logo`} className="block dark:hidden" height={32} src="/logo/white-on-black.svg" width={32} />
            <Image alt={t`Budgie logo`} className="hidden dark:block" height={32} src="/logo/black-on-white.svg" width={32} />
        </div>
    );
};
