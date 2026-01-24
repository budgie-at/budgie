import { ExtendedStackNavigationOptions } from 'expo-router/build/layouts/StackClient';

const SHEET_DETENT_HALF = 0.5;
const SHEET_DETENT_EXPANDED = 0.85;
const SHEET_CORNER_RADIUS = 24;

export const SELECTOR_MODAL_OPTIONS: ExtendedStackNavigationOptions = {
    presentation: 'formSheet',
    headerShown: false,
    sheetGrabberVisible: true,
    sheetAllowedDetents: [SHEET_DETENT_HALF, SHEET_DETENT_EXPANDED],
    sheetInitialDetentIndex: 1,
    sheetCornerRadius: SHEET_CORNER_RADIUS,
    contentStyle: { backgroundColor: 'transparent' }
};

export const SELECTOR_MODAL_FIT_OPTIONS: ExtendedStackNavigationOptions = {
    ...SELECTOR_MODAL_OPTIONS,
    sheetAllowedDetents: 'fitToContents'
};
