import { ExtendedStackNavigationOptions } from 'expo-router/build/layouts/StackClient';

const SHEET_DETENT_SMALL = 0.3;
const SHEET_DETENT_LARGE = 0.7;
const SHEET_CORNER_RADIUS = 24;

export const SPLIT_ENTRIES_MODAL_OPTIONS: ExtendedStackNavigationOptions = {
    presentation: 'formSheet',
    headerShown: false,
    sheetGrabberVisible: true,
    sheetAllowedDetents: [SHEET_DETENT_SMALL, SHEET_DETENT_LARGE],
    sheetCornerRadius: SHEET_CORNER_RADIUS,
    contentStyle: { backgroundColor: 'transparent' }
};
