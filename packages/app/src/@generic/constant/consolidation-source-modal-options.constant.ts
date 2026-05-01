import { ExtendedStackNavigationOptions } from 'expo-router/build/layouts/StackClient';

const SHEET_DETENT_SMALL = 0.45;
const SHEET_DETENT_LARGE = 0.9;
const SHEET_CORNER_RADIUS = 24;

export const CONSOLIDATION_SOURCE_MODAL_OPTIONS: ExtendedStackNavigationOptions = {
    presentation: 'formSheet',
    headerShown: false,
    sheetGrabberVisible: true,
    sheetAllowedDetents: [SHEET_DETENT_SMALL, SHEET_DETENT_LARGE],
    sheetCornerRadius: SHEET_CORNER_RADIUS,
    contentStyle: { backgroundColor: 'transparent' }
};
