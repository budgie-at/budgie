import type { NativeStackNavigationOptions } from 'expo-router';

const SHEET_DETENT_SMALL = 0.3;
const SHEET_DETENT_LARGE = 0.7;
const SHEET_CORNER_RADIUS = 24;

export const SPLIT_ENTRIES_MODAL_OPTIONS: NativeStackNavigationOptions = {
    presentation: 'formSheet',
    headerShown: false,
    sheetGrabberVisible: true,
    sheetAllowedDetents: [SHEET_DETENT_SMALL, SHEET_DETENT_LARGE],
    sheetCornerRadius: SHEET_CORNER_RADIUS,
    contentStyle: { backgroundColor: 'transparent' }
};
