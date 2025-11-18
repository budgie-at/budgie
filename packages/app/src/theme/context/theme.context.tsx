import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { ColorSchemaEnum } from '../enum/color-schema.enum';

import type { OnEventFn } from '@rnw-community/shared';

interface ThemeContextInterface {
    isDarkColorSchema: boolean;
    colorScheme: ColorSchemaEnum;
    toggleColorSchema: OnEventFn;
}

export const ThemeContext = createContext<ThemeContextInterface>({
    colorScheme: ColorSchemaEnum.Light,
    toggleColorSchema: emptyFn,
    isDarkColorSchema: false
});

export const useThemeContext = () => use(ThemeContext);
