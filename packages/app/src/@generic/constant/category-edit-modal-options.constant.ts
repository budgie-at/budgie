import { ExtendedStackNavigationOptions } from 'expo-router/build/layouts/StackClient';

const CATEGORY_EDIT_SHEET_DETENT = 0.85;
const SHEET_CORNER_RADIUS = 24;

export const CATEGORY_EDIT_MODAL_OPTIONS: ExtendedStackNavigationOptions = {
    presentation: 'formSheet',
    headerShown: false,
    sheetGrabberVisible: true,
    sheetAllowedDetents: [CATEGORY_EDIT_SHEET_DETENT],
    sheetCornerRadius: SHEET_CORNER_RADIUS,
    contentStyle: { backgroundColor: 'transparent' }
};
