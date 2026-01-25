import { ExtendedStackNavigationOptions } from 'expo-router/build/layouts/StackClient';

const SHEET_DETENT_COMPACT = 0.4;
const SHEET_DETENT_EXPANDED = 0.7;
const SHEET_CORNER_RADIUS = 24;

export const SELECTOR_MODAL_OPTIONS: ExtendedStackNavigationOptions = {
    presentation: 'formSheet',
    headerShown: false,
    sheetGrabberVisible: true,
    sheetAllowedDetents: [SHEET_DETENT_COMPACT, SHEET_DETENT_EXPANDED],
    sheetInitialDetentIndex: 0,
    sheetCornerRadius: SHEET_CORNER_RADIUS,
    contentStyle: { backgroundColor: 'transparent' }
};
