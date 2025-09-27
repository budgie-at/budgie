'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const defaultLogo = 'logo/black-on-white.svg';
const logoByTheme = {
    dark: 'logo/black-on-white.svg',
    light: 'logo/white-on-black.svg'
};

export const Logo = () => {
    const [mounted, setMounted] = useState(false);
    const { theme, resolvedTheme } = useTheme();

    const isDark = (theme === 'system' ? resolvedTheme : theme) === 'dark';
    const logo = mounted ? logoByTheme[isDark ? 'dark' : 'light'] : defaultLogo;

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground">
            <Image alt="Budgie logo" height={32} src={logo} width={32} />
        </div>
    );
};
