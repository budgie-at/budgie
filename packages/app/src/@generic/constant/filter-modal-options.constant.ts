import { ExtendedStackNavigationOptions } from 'expo-router/build/layouts/StackClient';

const SHEET_DETENT_COMPACT = 0.4;
const SHEET_DETENT_AMOUNT = 0.82;
const SHEET_DETENT_AMOUNT_LARGE = 0.96;
const SHEET_CORNER_RADIUS = 24;

export const COMPACT_FILTER_SHEET_OPTIONS: ExtendedStackNavigationOptions = {
    presentation: 'formSheet',
    headerShown: false,
    sheetGrabberVisible: true,
    sheetAllowedDetents: [SHEET_DETENT_COMPACT],
    sheetCornerRadius: SHEET_CORNER_RADIUS,
    contentStyle: { backgroundColor: 'transparent' }
};

export const AMOUNT_FILTER_SHEET_OPTIONS: ExtendedStackNavigationOptions = {
    presentation: 'formSheet',
    headerShown: false,
    sheetGrabberVisible: true,
    sheetAllowedDetents: [SHEET_DETENT_AMOUNT, SHEET_DETENT_AMOUNT_LARGE],
    sheetCornerRadius: SHEET_CORNER_RADIUS,
    contentStyle: { backgroundColor: 'transparent' }
};
