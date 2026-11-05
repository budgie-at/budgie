import { UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { RecurringAlertEnum } from '@budgie/recurring';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

import type { RecurringCalendarEntryInterface } from '@budgie/recurring';

interface Props {
    readonly entry: Pick<
        RecurringCalendarEntryInterface,
        'latestAmount' | 'isForecast' | 'title' | 'alert' | 'categoryTitle' | 'categoryIcon'
    >;
    readonly dayLabel?: string;
}

const rowVariants = cva('gap-x-xl', {
    variants: { isAccessibilityTextSize: { true: 'gap-y-sm', false: 'flex-row min-h-11 items-center' } }
});

const labelsVariants = cva('min-w-0 gap-y-xxs', {
    variants: { isAccessibilityTextSize: { true: '', false: 'flex-1 min-h-[38px] justify-center mr-xs' } }
});

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
        <View className={rowVariants({ isAccessibilityTextSize })}>
            <CircleIcon size={36} iconSize={18} radius={18} border={false} icon={icon} variant="secondary" />
            <View className={labelsVariants({ isAccessibilityTextSize })}>
                <Text dynamicTypeRamp="headline" className="text-[16px] font-semibold text-primary" lineBreakStrategyIOS="standard">
                    {entry.title}
                </Text>
                {isAccessibilityTextSize ? (
                    <Text dynamicTypeRamp="footnote" className="text-[12px] text-secondary-foreground">
                        {metadataLabel}
                    </Text>
                ) : null}
                <Text
                    dynamicTypeRamp="footnote"
                    className="text-[12px] text-secondary-foreground"
                    numberOfLines={labelLineLimit}
                    ellipsizeMode="tail"
                >
                    {description}
                </Text>
            </View>
            <Text dynamicTypeRamp="headline" className="shrink-0 text-[16px] font-semibold text-primary tabular-nums">
                {protectAmount(convertFromMicroUnits(entry.latestAmount), defaultInstrument.symbol)}
            </Text>
        </View>
    );
};
