import { isString } from '@rnw-community/shared';

import { formSheetOptions } from './form-sheet-options.util';

import type { NativeStackNavigationOptions } from 'expo-router';

export const fitToContentsSheetOptions = (surfaceColor: string | number | undefined): NativeStackNavigationOptions => ({
    ...formSheetOptions('fitToContents'),
    ...(isString(surfaceColor) && { contentStyle: { backgroundColor: surfaceColor } })
});
