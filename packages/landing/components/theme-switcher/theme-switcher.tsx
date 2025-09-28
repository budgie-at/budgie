import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Button } from '../ui/button';

export const ThemeSwitcher = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = (): void => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <Button className="rounded-full" onClick={toggleTheme} size="icon" variant="ghost">
            {mounted && theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}

            <span className="sr-only">Toggle theme</span>
        </Button>
    );
};
