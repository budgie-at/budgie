import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import type { OnEventFn } from '@rnw-community/shared';

interface ThemeContextInterface {
    isDarkColorSchema: boolean;
    toggleColorSchema: OnEventFn;
}

export const ThemeContext = createContext<ThemeContextInterface>({
    toggleColorSchema: emptyFn,
    isDarkColorSchema: false
});

export const useThemeContext = () => use(ThemeContext);
