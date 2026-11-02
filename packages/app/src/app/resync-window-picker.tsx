import { ResyncService } from '@budgie/sync';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { FormsheetHeader } from '../@generic/component/formsheet-header/formsheet-header';
import { GroupedListSection } from '../@generic/component/grouped-list-section/grouped-list-section';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useSingleFlight } from '../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../@generic/utils/toast-on-failure.util';
import { useGetAccountByIdQuery } from '../account/query/use-get-account-by-id.query';
import { ResyncWindowOptionRow } from '../sync/component/resync-window-option-row/resync-window-option-row';
import { RESYNC_WINDOW_OPTIONS } from '../sync/constant/resync-window-options.constant';
import { useResyncWindowPickerModal, useResyncWindowPickerModalParams } from '../sync/context/resync-window-picker-modal.context';

const WINDOW_SUCCESS_MESSAGES: Record<string, MessageDescriptor> = {
    null: msg`Entire history will be re-synced on next sync.`,
    7: msg`Re-sync of last 7 days will start on next sync.`,
    30: msg`Re-sync of last 30 days will start on next sync.`,
    90: msg`Re-sync of last 90 days will start on next sync.`
};

export default function ResyncWindowPickerModal() {
    const { t } = useLingui();
    const [, resolveResyncWindowPicker, dismissResyncWindowPicker] = useResyncWindowPickerModal();
    useModalDismiss(dismissResyncWindowPicker);
    const { run } = useSingleFlight();

    const accountId = useResyncWindowPickerModalParams()?.accountId ?? 0;
    const { account } = useGetAccountByIdQuery(accountId);
    const { bottom } = useSafeAreaInsets();
    const options = isPositiveNumber(accountId) && isDefined(account) ? RESYNC_WINDOW_OPTIONS : [];
    const contentStyle = { paddingBottom: bottom };
    const accountTitle = account?.title;
    const description =
        isPositiveNumber(accountId) && isDefined(accountTitle)
            ? t`${accountTitle} · Choose a period to start syncing.`
            : t`Choose a period to start syncing.`;

    const resync = (sinceDays: number | null) => {
        void run(
            Effect.flatMap(ResyncService, resyncService => resyncService.resync({ accountId, sinceDays })).pipe(
                Effect.tap(() =>
                    Effect.sync(
                        () =>
                            void Toast.show({
                                type: 'success',
                                text1: t`Bank sync reset`,
                                text2: t(WINDOW_SUCCESS_MESSAGES[String(sinceDays)])
                            })
                    )
                ),
                toastOnFailure(t`Could not reset bank sync`)
            )
        );
    };

    const handleOptionPress = (sinceDays: number | null) => {
        if (!isPositiveNumber(accountId) || !isDefined(account)) {
            return;
        }

        resolveResyncWindowPicker(null);
        resync(sinceDays);
    };

    return (
        <View className="bg-grouped-surface" collapsable={false}>
            <FormsheetHeader size="md" title={t`Sync past transactions`} description={description} />
            <View className="px-3xl pt-[16px] gap-y-[24px]" style={contentStyle}>
                <GroupedListSection>
                    {options
                        .filter(option => isDefined(option.sinceDays))
                        .map(option => (
                            <ResyncWindowOptionRow key={String(option.sinceDays)} option={option} onSelect={handleOptionPress} />
                        ))}
                </GroupedListSection>
                <GroupedListSection footer={t`Duplicates are merged automatically. Your categories, tags and notes stay.`}>
                    {options
                        .filter(option => !isDefined(option.sinceDays))
                        .map(option => (
                            <ResyncWindowOptionRow key={String(option.sinceDays)} option={option} onSelect={handleOptionPress} />
                        ))}
                </GroupedListSection>
            </View>
        </View>
    );
}
