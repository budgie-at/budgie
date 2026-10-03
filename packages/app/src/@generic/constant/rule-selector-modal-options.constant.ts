import type { NativeStackNavigationOptions } from 'expo-router';

const SHEET_DETENT = 0.75;
const SHEET_CORNER_RADIUS = 24;

export const RULE_SELECTOR_MODAL_OPTIONS: NativeStackNavigationOptions = {
    presentation: 'formSheet',
    headerShown: false,
    sheetGrabberVisible: true,
    sheetAllowedDetents: [SHEET_DETENT],
    sheetCornerRadius: SHEET_CORNER_RADIUS,
    contentStyle: { backgroundColor: 'transparent' }
};
