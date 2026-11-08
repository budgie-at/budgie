import { isString } from '@rnw-community/shared';

import type { NativeStackNavigationOptions } from 'expo-router';

const SHEET_CORNER_RADIUS = 24;

export const fitToContentsSheetOptions = (surfaceColor: string | number | undefined): NativeStackNavigationOptions => ({
    presentation: 'formSheet',
    headerShown: false,
    sheetGrabberVisible: true,
    sheetAllowedDetents: 'fitToContents',
    sheetCornerRadius: SHEET_CORNER_RADIUS,
    contentStyle: isString(surfaceColor) ? { backgroundColor: surfaceColor } : { backgroundColor: 'transparent' }
});
