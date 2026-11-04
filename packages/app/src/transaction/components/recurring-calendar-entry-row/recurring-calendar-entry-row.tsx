import { RecurringSeriesUserStateEnum, UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { RecurringAlertEnum, RecurringService } from '@budgie/recurring';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import * as Effect from 'effect/Effect';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { DeletableRow } from '../../../@generic/component/deletable-row/deletable-row';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { TransactionListRowPositionEnum } from '../../enum/transaction-list-row-position.enum';
import { RecurringCalendarSelector } from '../recurring-calendar-content/recurring-calendar.selector';
import { RecurringSeriesTitleInput } from '../recurring-series-title-input/recurring-series-title-input';
import { TransactionRowLayout } from '../transaction-row-layout/transaction-row-layout';
import { TransactionRowSurface } from '../transaction-row-surface/transaction-row-surface';

import type { RecurringCalendarEntryInterface } from '@budgie/recurring';

interface Props {
    readonly entry: RecurringCalendarEntryInterface;
    readonly position: TransactionListRowPositionEnum;
    readonly onPress?: () => void;
    readonly dayLabel?: string;
}

const amountVariants = cva('text-[15px] font-semibold text-primary tabular-nums', {
    variants: { isAccessibilityTextSize: { true: 'mt-md', false: '' } }
});

// eslint-disable-next-line max-statements -- Row derives navigation, day-label, alert and series-action affordances from entry data
export const RecurringCalendarEntryRow = ({ entry, position, onPress, dayLabel }: Props) => {
    const router = useRouter();
    const { t } = useLingui();
    const [isRenaming, setIsRenaming] = useState(false);
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const labelLineLimit = isAccessibilityTextSize ? 0 : 2;
    const separatorInset = isAccessibilityTextSize ? 16 : void 0;
    const statusLabel = entry.isForecast ? t`Expected` : t`Recorded`;
    const metadataLabel = isNotEmptyString(dayLabel) ? dayLabel : statusLabel;

    const formattedAmount = protectAmount(convertFromMicroUnits(entry.latestAmount), defaultInstrument.symbol);
    const alertLabels = {
        [RecurringAlertEnum.OVERDUE]: t`Overdue`,
        [RecurringAlertEnum.PRICE_CHANGE]: t`Price changed`
    };
    const detail = isDefined(entry.alert) ? alertLabels[entry.alert] : (entry.categoryTitle ?? entry.title);
    const description = isAccessibilityTextSize ? detail : `${metadataLabel} · ${detail}`;
    const icon = entry.categoryIcon ?? UserIconNameEnum.Wallet;
    let handlePress = onPress;

    if (!isDefined(handlePress) && isDefined(entry.latestTransactionId)) {
        handlePress = () => {
            router.push({
                pathname: '/transactions/[id]/expense',
                params: { id: String(entry.latestTransactionId) }
            });
        };
    }

    const setUserState = (userState: RecurringSeriesUserStateEnum) =>
        appRuntime.runFork(
            logAndContinue(
                Effect.flatMap(RecurringService, recurringService => recurringService.setUserState(entry.seriesId, userState)).pipe(
                    toastOnFailure(t`Could not update recurring payment.`)
                )
            )
        );

    const handleDismiss = () => void setUserState(RecurringSeriesUserStateEnum.DISMISSED);
    const handleRenameDone = () => void setIsRenaming(false);
    const confirmButtons =
        entry.userState === RecurringSeriesUserStateEnum.SUGGESTED
            ? [{ text: t`Confirm recurring`, onPress: () => void setUserState(RecurringSeriesUserStateEnum.CONFIRMED) }]
            : [];

    const handleLongPress = () =>
        void Alert.alert(entry.title, void 0, [
            ...confirmButtons,
            { text: t`Rename`, onPress: () => void setIsRenaming(true) },
            { text: t`Cancel`, style: 'cancel' }
        ]);

    return (
        <TransactionRowSurface position={position} separatorInset={separatorInset}>
            {isRenaming ? (
                <RecurringSeriesTitleInput seriesId={entry.seriesId} title={entry.title} onDone={handleRenameDone} />
            ) : (
                <DeletableRow id={entry.seriesId} onDelete={handleDismiss} label={t`Dismiss`}>
                    <HapticPressable
                        className="px-3xl py-xl active:scale-100 active:opacity-70"
                        testID={RecurringCalendarSelector.Row(entry.title)}
                        onLongPress={handleLongPress}
                        {...(isDefined(handlePress) && { onPress: handlePress, accessibilityRole: 'button' as const })}
                    >
                        <TransactionRowLayout
                            icon={<CircleIcon size={36} iconSize={18} radius={18} border={false} icon={icon} variant="secondary" />}
                            amount={<Text className={amountVariants({ isAccessibilityTextSize })}>{formattedAmount}</Text>}
                        >
                            <Text className="text-[15px] font-semibold text-primary" numberOfLines={labelLineLimit} ellipsizeMode="tail">
                                {entry.title}
                            </Text>
                            {isAccessibilityTextSize ? (
                                <Text className="text-[13px] text-secondary-foreground mt-xs">{metadataLabel}</Text>
                            ) : null}
                            <Text className="text-[13px] text-secondary-foreground" numberOfLines={labelLineLimit} ellipsizeMode="tail">
                                {description}
                            </Text>
                        </TransactionRowLayout>
                    </HapticPressable>
                </DeletableRow>
            )}
        </TransactionRowSurface>
    );
};
