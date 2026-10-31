import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';
import { useInstallmentAmountLabel } from '../../hook/use-installment-amount-label.hook';
import { useSettledAnnouncement } from '../../hook/use-settled-announcement.hook';
import { ConvertToInstallmentTotal } from '../convert-to-installment-total/convert-to-installment-total';

import type { ConvertToInstallmentModalParamsInterface } from '../../interface/convert-to-installment-modal-params.interface';
import type { InstallmentSplitInterface } from '../../interface/installment-split.interface';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly params: Pick<ConvertToInstallmentModalParamsInterface, 'amount' | 'instrumentSymbol'>;
    readonly split: InstallmentSplitInterface;
    readonly recoveryNote: string;
    readonly onLayout: (event: LayoutChangeEvent) => void;
}

export const ConvertToInstallmentParts = ({ params, split, recoveryNote, onLayout }: Props) => {
    const { t } = useLingui();
    const formatAmount = useInstallmentAmountLabel();
    const { installmentCount, planTotal, regularAmount, lastAmount, isSinglePaymentLeft, hasEqualParts, isSplittable } = split;

    const formattedPayment = formatAmount(isSinglePaymentLeft ? lastAmount : regularAmount, params.instrumentSymbol);
    const formattedLast = formatAmount(lastAmount, params.instrumentSymbol);
    const formattedTotal = formatAmount(planTotal, params.instrumentSymbol);
    const formattedPaid = formatAmount(params.amount, params.instrumentSymbol);
    const summary = [
        t({ message: plural(installmentCount, { one: '# payment in total', other: '# payments in total' }) }),
        t`first ${formattedPaid} already paid`,
        ...(hasEqualParts
            ? [
                  t({
                      message: plural(installmentCount - 1, {
                          one: `# more payment of ${formattedLast}`,
                          other: `# more payments of ${formattedLast}`
                      })
                  })
              ]
            : [
                  t({
                      message: plural(installmentCount - 2, {
                          one: `# more payment of ${formattedPayment}`,
                          other: `# more payments of ${formattedPayment}`
                      })
                  }),
                  t`last payment ${formattedLast}`
              ]),
        t`plan total ${formattedTotal}`
    ].join(', ');
    const announcement = isSplittable ? summary : `${t`Payment schedule unavailable`}. ${recoveryNote}`;
    const splitNote =
        hasEqualParts || !isSplittable
            ? t`First ${formattedPaid} already paid`
            : t`First ${formattedPaid} already paid · last payment ${formattedLast}`;

    const splitNoteImportance = isSplittable ? 'no-hide-descendants' : 'auto';

    useSettledAnnouncement(announcement);

    const hero = isSplittable ? (
        <View
            className="w-full flex-row flex-wrap items-baseline justify-center gap-x-xs gap-y-xxs"
            accessible
            accessibilityLabel={summary}
            testID={ConvertToInstallmentModalSelector.PartsLabel}
        >
            <Text className="shrink text-7xl font-light text-primary tabular-nums" numberOfLines={1} adjustsFontSizeToFit>
                {formattedPayment}
            </Text>
            <Text className="text-lg font-medium text-secondary-foreground">
                {isSinglePaymentLeft ? <Trans>next month</Trans> : <Trans>/ month</Trans>}
            </Text>
        </View>
    ) : (
        <View
            className="w-full items-center gap-y-xxs"
            accessible
            accessibilityLabel={announcement}
            testID={ConvertToInstallmentModalSelector.PartsLabel}
        >
            <Text className="text-center text-lg font-semibold text-primary">
                <Trans>Payment schedule unavailable</Trans>
            </Text>
            <Text className="text-center text-sm text-red-700 dark:text-destructive-foreground">{recoveryNote}</Text>
        </View>
    );

    return (
        <View className="items-center gap-y-xxs" onLayout={onLayout}>
            {hero}
            <ConvertToInstallmentTotal instrumentSymbol={params.instrumentSymbol} split={split} />
            <Text
                className="text-center text-sm text-secondary-foreground tabular-nums"
                accessibilityElementsHidden={isSplittable}
                importantForAccessibility={splitNoteImportance}
            >
                {splitNote}
            </Text>
        </View>
    );
};
