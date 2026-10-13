import { ResyncService } from '@budgie/sync';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { ScrollView, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../@generic/component/circle-icon/circle-icon';
import { FormsheetHeader } from '../@generic/component/formsheet-header/formsheet-header';
import { HorizontalCell } from '../@generic/component/horizontal-cell/horizontal-cell';
import { useEffectAction } from '../@generic/hook/use-effect-action.hook';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { confirmAlert } from '../@generic/utils/confirm-alert/confirm-alert.util';
import { RESYNC_WINDOW_OPTIONS } from '../sync/constant/resync-window-options.constant';
import { useResyncWindowPickerModal, useResyncWindowPickerModalParams } from '../sync/context/resync-window-picker-modal.context';

import { ResyncWindowPickerSelector } from './resync-window-picker.selector';

import type { ResyncWindowOptionInterface } from '../sync/interface/resync-window-option.interface';

const WINDOW_TEXT: Record<string, { readonly label: MessageDescriptor; readonly successMessage: MessageDescriptor }> = {
    null: { label: msg`Re-sync entire history`, successMessage: msg`Entire history will be re-synced on next sync.` },
    7: { label: msg`Last 7 days`, successMessage: msg`Re-sync of last 7 days will start on next sync.` },
    30: { label: msg`Last 30 days`, successMessage: msg`Re-sync of last 30 days will start on next sync.` },
    90: { label: msg`Last 90 days`, successMessage: msg`Re-sync of last 90 days will start on next sync.` }
};

export default function ResyncWindowPickerModal() {
    const { t } = useLingui();
    const [, resolveResyncWindowPicker, dismissResyncWindowPicker] = useResyncWindowPickerModal();
    useModalDismiss(dismissResyncWindowPicker);
    const [run] = useEffectAction(t`Could not reset bank sync`);

    const accountId = useResyncWindowPickerModalParams()?.accountId ?? 0;

    const resync = (sinceDays: number | null) => {
        run(
            Effect.flatMap(ResyncService, resyncService => resyncService.resync({ accountId, sinceDays })),
            () => void Toast.show({ type: 'success', text1: t`Bank sync reset`, text2: t(WINDOW_TEXT[String(sinceDays)].successMessage) })
        );
    };

    const handleOptionPress = (option: ResyncWindowOptionInterface) => async () => {
        resolveResyncWindowPicker(null);

        if (isDefined(option.sinceDays)) {
            resync(option.sinceDays);

            return;
        }

        const confirmed = await confirmAlert({
            title: t`Re-sync Bank Account?`,
            message: t`This will reset the sync history and re-sync all transactions from this bank account. Your existing transactions, tags, and categories will be preserved and updated with any new data.`,
            confirmText: t`Re-sync History`,
            cancelText: t`Cancel`
        });

        if (confirmed) {
            resync(null);
        }
    };

    return (
        <View className="flex-1 bg-primary-reverse">
            <FormsheetHeader size="md" title={t`Re-sync transactions`} description={t`Pick a window. Existing data is preserved.`} />

            <ScrollView contentContainerClassName="px-3xl pt-md gap-y-md pb-5xl" showsVerticalScrollIndicator={false}>
                {RESYNC_WINDOW_OPTIONS.map(option => {
                    const label = t(WINDOW_TEXT[String(option.sinceDays)].label);
                    const { isDestructive } = option;
                    const labelClassName = isDestructive
                        ? 'text-md font-semibold text-destructive-foreground'
                        : 'text-md font-semibold text-primary';
                    const iconVariant = isDestructive ? 'destructive' : 'primary';
                    const optionTestID = ResyncWindowPickerSelector.Option(option.sinceDays ?? 'all');

                    return (
                        <HorizontalCell
                            key={String(option.sinceDays)}
                            size="md"
                            onPress={handleOptionPress(option)}
                            left={<CircleIcon icon={option.icon} variant={iconVariant} size={40} iconSize={18} />}
                            testID={optionTestID}
                        >
                            <Text className={labelClassName}>{label}</Text>
                            {isDestructive ? (
                                <Text className="mt-1 text-sm text-secondary-foreground">
                                    <Trans>Resets all sync state</Trans>
                                </Text>
                            ) : null}
                        </HorizontalCell>
                    );
                })}
            </ScrollView>
        </View>
    );
}
