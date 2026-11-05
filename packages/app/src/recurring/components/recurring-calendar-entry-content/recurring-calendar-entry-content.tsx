import { convertFromMicroUnits } from '@budgie/contracts';
import { RecurringAlertEnum } from '@budgie/recurring';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { RecurringRowLayout } from '../recurring-row-layout/recurring-row-layout';

import type { RecurringCalendarEntryInterface } from '@budgie/recurring';

interface Props {
    readonly entry: Pick<
        RecurringCalendarEntryInterface,
        'latestAmount' | 'isForecast' | 'title' | 'alert' | 'categoryTitle' | 'categoryIcon'
    >;
    readonly dayLabel?: string;
}

const amountVariants = cva('shrink-0 text-[16px] font-semibold text-primary tabular-nums', {
    variants: { isAccessibilityTextSize: { true: 'basis-full pl-[48px]', false: '' } }
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
        [RecurringAlertEnum.PRICE_CHANGE]: t`Price changed`,
        [RecurringAlertEnum.ENDING]: t`Ending soon`
    };
    const detail = isDefined(entry.alert) ? alertLabels[entry.alert] : (entry.categoryTitle ?? entry.title);
    const description = isAccessibilityTextSize ? detail : `${metadataLabel} · ${detail}`;

    return (
        <RecurringRowLayout
            icon={entry.categoryIcon}
            title={entry.title}
            trailing={
                <Text dynamicTypeRamp="headline" className={amountVariants({ isAccessibilityTextSize })}>
                    {protectAmount(convertFromMicroUnits(entry.latestAmount), defaultInstrument.symbol)}
                </Text>
            }
        >
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
        </RecurringRowLayout>
    );
};
