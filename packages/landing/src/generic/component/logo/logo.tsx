'use client';

import { useLingui } from '@lingui/react/macro';
import Image from 'next/image';
import { useTheme } from 'next-themes';

export const Logo = () => {
    const { t } = useLingui();
    const { theme, resolvedTheme } = useTheme();

    const isDark = (theme === 'system' ? resolvedTheme : theme) === 'dark';
    const logo = isDark ? '/logo/black-on-white.svg' : '/logo/white-on-black.svg';

    return (
        <div className="size-8 rounded-lg bg-linear-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground">
            <Image alt={t`Budgie logo`} height={32} src={logo} width={32} />
        </div>
    );
};
