import type { NativeStackNavigationOptions } from 'expo-router';

const SHEET_CORNER_RADIUS = 24;

export const CONSOLIDATION_SOURCE_MODAL_OPTIONS: NativeStackNavigationOptions = {
    presentation: 'formSheet',
    headerShown: false,
    sheetGrabberVisible: true,
    sheetAllowedDetents: 'fitToContents',
    sheetCornerRadius: SHEET_CORNER_RADIUS,
    contentStyle: { backgroundColor: 'transparent' }
};
