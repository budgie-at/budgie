import { ResyncService } from '@budgie/sync';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { ScrollView, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { SheetTitleRow } from '../../../@generic/component/sheet-title-row/sheet-title-row';
import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
import { useMorphingSheetDismiss } from '../../../@generic/context/morphing-sheet.context';
import { useMorphingSheetListHeight } from '../../../@generic/hook/use-morphing-sheet-list-height.hook';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { RESYNC_WINDOW_OPTIONS } from '../../constant/resync-window-options.constant';
import { ResyncWindowOptionRow } from '../resync-window-option-row/resync-window-option-row';

const WINDOW_SUCCESS_MESSAGES: Record<string, MessageDescriptor> = {
    null: msg`Entire history will be re-synced on next sync.`,
    7: msg`Re-sync of last 7 days will start on next sync.`,
    30: msg`Re-sync of last 30 days will start on next sync.`,
    90: msg`Re-sync of last 90 days will start on next sync.`
};

interface Props {
    readonly accountId: number;
}

export const ResyncWindowPickerModalContent = ({ accountId }: Props) => {
    const { t } = useLingui();
    const dismiss = useMorphingSheetDismiss();
    const { run } = useSingleFlight();
    const { account } = useGetAccountByIdQuery(accountId);
    const { height } = useMorphingSheetListHeight(MORPHING_SHEET_SELECTOR_HEIGHT_RATIO);
    const options = isPositiveNumber(accountId) && isDefined(account) ? RESYNC_WINDOW_OPTIONS : [];
    const scrollStyle = { flexGrow: 0, maxHeight: height };
    const accountTitle = account?.title;
    const accountHeading =
        isPositiveNumber(accountId) && isNotEmptyString(accountTitle) ? (
            <Text className="text-center text-[15px] font-semibold text-primary">{accountTitle}</Text>
        ) : null;

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

        dismiss();
        resync(sinceDays);
    };

    return (
        <SheetSurface
            className="flex-none pt-lg"
            contentClassName="flex-none"
            header={
                <View className="px-xl">
                    <SheetTitleRow title={t`Sync past transactions`} />
                </View>
            }
        >
            <ScrollView style={scrollStyle} bounces={false} showsVerticalScrollIndicator={false}>
                <View className="gap-y-[4px] px-3xl pt-xl">
                    {accountHeading}
                    <Text className="text-center text-[13px] text-secondary-foreground">
                        <Trans>Choose a period to re-sync past transactions.</Trans>
                    </Text>
                </View>
                <View className="gap-y-[24px] px-3xl pt-[24px] pb-[16px]">
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
            </ScrollView>
        </SheetSurface>
    );
};
