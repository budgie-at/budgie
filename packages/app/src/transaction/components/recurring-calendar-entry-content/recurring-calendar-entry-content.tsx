import { UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { RecurringAlertEnum } from '@budgie/recurring';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { TRANSACTION_SECONDARY_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/transaction-secondary-max-font-size-multiplier.constant';
import { TransactionCardLayout } from '../transaction-card-layout/transaction-card-layout';

import type { RecurringCalendarEntryInterface } from '@budgie/recurring';

interface Props {
    readonly entry: Pick<
        RecurringCalendarEntryInterface,
        'latestAmount' | 'isForecast' | 'title' | 'alert' | 'categoryTitle' | 'categoryIcon'
    >;
    readonly dayLabel?: string;
}

export const RecurringCalendarEntryContent = ({ entry, dayLabel }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const labelLineLimit = isAccessibilityTextSize ? 0 : 2;
    const statusLabel = entry.isForecast ? t`Expected` : t`Recorded`;
    const metadataLabel = isNotEmptyString(dayLabel) ? dayLabel : statusLabel;
    const alertLabels = {
        [RecurringAlertEnum.OVERDUE]: t`Overdue`,
        [RecurringAlertEnum.PRICE_CHANGE]: t`Amount changed`
    };
    const detail = isDefined(entry.alert) ? alertLabels[entry.alert] : (entry.categoryTitle ?? entry.title);
    const description = isAccessibilityTextSize ? detail : `${metadataLabel} · ${detail}`;
    const icon = entry.categoryIcon ?? UserIconNameEnum.Wallet;

    return (
        <TransactionCardLayout
            icon={<CircleIcon size={36} iconSize={18} radius={18} border={false} icon={icon} variant="secondary" />}
            title={
                <Text dynamicTypeRamp="headline" className="text-[16px] font-semibold text-primary" lineBreakStrategyIOS="standard">
                    {entry.title}
                </Text>
            }
            amount={
                <Text dynamicTypeRamp="headline" className="shrink-0 text-[16px] font-semibold text-primary tabular-nums">
                    {protectAmount(convertFromMicroUnits(entry.latestAmount), defaultInstrument.symbol)}
                </Text>
            }
        >
            {isAccessibilityTextSize ? (
                <Text
                    dynamicTypeRamp="footnote"
                    maxFontSizeMultiplier={TRANSACTION_SECONDARY_MAX_FONT_SIZE_MULTIPLIER}
                    className="text-[12px] text-secondary-foreground"
                >
                    {metadataLabel}
                </Text>
            ) : null}
            <Text
                dynamicTypeRamp="footnote"
                maxFontSizeMultiplier={TRANSACTION_SECONDARY_MAX_FONT_SIZE_MULTIPLIER}
                className="text-[12px] text-secondary-foreground"
                numberOfLines={labelLineLimit}
                ellipsizeMode="tail"
            >
                {description}
            </Text>
        </TransactionCardLayout>
    );
};
