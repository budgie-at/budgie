import { ExtendedStackNavigationOptions } from 'expo-router/build/layouts/StackClient';

const SHEET_DETENT_COMPACT = 0.6;
const SHEET_DETENT_EXPANDED = 0.9;
const SHEET_CORNER_RADIUS = 24;

export const ICON_SELECTOR_MODAL_OPTIONS: ExtendedStackNavigationOptions = {
    presentation: 'formSheet',
    headerShown: false,
    sheetGrabberVisible: true,
    sheetAllowedDetents: [SHEET_DETENT_COMPACT, SHEET_DETENT_EXPANDED],
    sheetCornerRadius: SHEET_CORNER_RADIUS,
    contentStyle: { backgroundColor: 'transparent' }
};
