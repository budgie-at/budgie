'use client';

import { useLingui } from '@lingui/react/macro';
import Image from 'next/image';
import { useTheme } from 'next-themes';

import darkLogo from '../../../../public/logo/black-on-white.svg';
import lightLogo from '../../../../public/logo/white-on-black.svg';

export const Logo = () => {
    const { t } = useLingui();
    const { theme, resolvedTheme } = useTheme();

    const isDark = (theme === 'system' ? resolvedTheme : theme) === 'dark';
    const logo = isDark ? darkLogo : lightLogo;

    return (
        <div className="size-8 rounded-lg bg-linear-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground">
            <Image alt={t`Budgie logo`} height={32} src={logo} width={32} />
        </div>
    );
};
