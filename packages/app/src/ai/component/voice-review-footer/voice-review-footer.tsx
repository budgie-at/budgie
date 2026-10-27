import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';

import { VoiceReviewFooterSelector } from './voice-review-footer.selector';

const TABULAR_NUMS_STYLE = { fontVariant: ['tabular-nums' as const] };

interface Props {
    readonly count: number;
    readonly totalAmount: number;
    readonly currencySymbol: string;
    readonly onCancel: () => void;
    readonly onReRecord: () => void;
    readonly children: ReactNode;
}

export const VoiceReviewFooter = (props: Props) => {
    const { count, totalAmount, currencySymbol, onCancel, onReRecord, children } = props;
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
    const totalLabel = formatDigits(totalAmount, `${currencySymbol} `);

    return (
        <View className="border-t border-secondary-background bg-background px-lg pt-md pb-safe">
            {isPositiveNumber(count) ? (
                <View className="mb-md flex-row items-baseline justify-between">
                    <Text className="text-sm uppercase tracking-wider text-secondary-foreground">{t`Total`}</Text>
                    <Text className="text-2xl font-bold text-primary" style={TABULAR_NUMS_STYLE}>
                        {totalLabel}
                    </Text>
                </View>
            ) : null}

            <View className="flex-row gap-x-md">
                <Button
                    variant="ghost"
                    content={t`Cancel`}
                    onPress={onCancel}
                    className="flex-1"
                    testID={VoiceReviewFooterSelector.CancelButton}
                />
                <Button
                    variant="secondary"
                    leftIcon={UserIconNameEnum.RefreshCw}
                    content={t`Re-record`}
                    onPress={onReRecord}
                    className="flex-1"
                    testID={VoiceReviewFooterSelector.ReRecordButton}
                />
            </View>

            {isPositiveNumber(count) ? <View className="mt-md">{children}</View> : null}
        </View>
    );
};
