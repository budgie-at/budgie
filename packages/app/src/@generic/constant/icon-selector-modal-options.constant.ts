import { ExtendedStackNavigationOptions } from 'expo-router/build/layouts/StackClient';

const ICON_SELECTOR_SHEET_DETENT = 0.6;
const SHEET_CORNER_RADIUS = 24;

export const ICON_SELECTOR_MODAL_OPTIONS: ExtendedStackNavigationOptions = {
    presentation: 'formSheet',
    headerShown: false,
    sheetGrabberVisible: true,
    sheetAllowedDetents: [ICON_SELECTOR_SHEET_DETENT],
    sheetCornerRadius: SHEET_CORNER_RADIUS,
    contentStyle: { backgroundColor: 'transparent' }
};
