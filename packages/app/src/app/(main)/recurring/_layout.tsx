import { Stack } from 'expo-router';

import { ScreenLayout } from '../../../@generic/component/screen-layout/screen-layout';
import { DEFAULT_STACK_OPTIONS } from '../../../@generic/constant/default-stack-options.constant';
import { formSheetOptions } from '../../../@generic/utils/form-sheet-options.util';

const DETENT_55 = 0.55;
const DETENT_90 = 0.9;
const MAKE_RECURRING_OPTIONS = formSheetOptions([DETENT_55, DETENT_90], 0);

export default function RecurringLayout() {
    return (
        <Stack screenOptions={DEFAULT_STACK_OPTIONS} screenLayout={ScreenLayout}>
            <Stack.Screen name="make-recurring" options={MAKE_RECURRING_OPTIONS} />
        </Stack>
    );
}
