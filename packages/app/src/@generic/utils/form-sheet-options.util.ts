import { isDefined } from '@rnw-community/shared';

import type { NativeStackNavigationOptions } from 'expo-router';

const SHEET_CORNER_RADIUS = 24;

export const formSheetOptions = (
    detents: NonNullable<NativeStackNavigationOptions['sheetAllowedDetents']>,
    initialDetentIndex?: number
): NativeStackNavigationOptions => ({
    presentation: 'formSheet',
    headerShown: false,
    sheetGrabberVisible: true,
    sheetAllowedDetents: detents,
    sheetCornerRadius: SHEET_CORNER_RADIUS,
    contentStyle: { backgroundColor: 'transparent' },
    ...(isDefined(initialDetentIndex) && { sheetInitialDetentIndex: initialDetentIndex })
});
