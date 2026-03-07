import { ExtendedStackNavigationOptions } from 'expo-router/build/layouts/StackClient';

export const SHEET_DETENT = 0.5;
const SHEET_CORNER_RADIUS = 24;

export const SUGGEST_RULE_MODAL_OPTIONS: ExtendedStackNavigationOptions = {
    presentation: 'formSheet',
    headerShown: false,
    sheetGrabberVisible: true,
    sheetAllowedDetents: [SHEET_DETENT],
    sheetCornerRadius: SHEET_CORNER_RADIUS
};
