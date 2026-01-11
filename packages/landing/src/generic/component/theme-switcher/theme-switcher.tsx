'use client';

import { Trans } from '@lingui/react/macro';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '../../../ui/button';
import { useMounted } from '../../hook/use-mounted.hook';

export const ThemeSwitcher = () => {
    const { resolvedTheme, setTheme } = useTheme();
    const mounted = useMounted();

    const handleClick = (): void => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };

    const isDark = mounted && resolvedTheme === 'dark';

    return (
        <Button className="rounded-full" onClick={handleClick} size="icon" variant="ghost">
            {isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}

            <span className="sr-only">
                <Trans>Toggle theme</Trans>
            </span>
        </Button>
    );
};
