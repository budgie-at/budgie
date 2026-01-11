import { Trans } from '@lingui/react/macro';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '../../../ui/button';

export const ThemeSwitcher = () => {
    const { theme, setTheme } = useTheme();

    const handleClick = (): void => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <Button className="rounded-full" onClick={handleClick} size="icon" variant="ghost">
            {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}

            <span className="sr-only">
                <Trans>Toggle theme</Trans>
            </span>
        </Button>
    );
};
