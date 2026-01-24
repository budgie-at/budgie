import { Stack } from 'expo-router';

import { CONFIRM_ACTION_MODAL_OPTIONS } from '../../@generic/constant/confirm-action-modal-options.constant';
import { DEFAULT_STACK_OPTIONS } from '../../@generic/constant/default-stack-options.constant';
import { SELECTOR_MODAL_OPTIONS } from '../../@generic/constant/selector-modal-options.constant';

export default function ModalsLayout() {
    return (
        <Stack screenOptions={DEFAULT_STACK_OPTIONS}>
            <Stack.Screen name="confirm-action" options={CONFIRM_ACTION_MODAL_OPTIONS} />
            <Stack.Screen name="category-selector" options={SELECTOR_MODAL_OPTIONS} />
            <Stack.Screen name="account-selector" options={SELECTOR_MODAL_OPTIONS} />
            <Stack.Screen name="tag-selector" options={SELECTOR_MODAL_OPTIONS} />
        </Stack>
    );
}
