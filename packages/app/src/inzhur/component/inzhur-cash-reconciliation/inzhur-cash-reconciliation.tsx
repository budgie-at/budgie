import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { FormAmountInput } from '../../../@generic/component/form-amount-input/form-amount-input';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { CreateAccountSelector } from '../../../app/(main)/create-account/create-account.selector';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';

interface Props {
    readonly trackedBalance: number;
    readonly value: number;
    readonly onChange: (value: number) => void;
    readonly instrumentSymbol: string;
}

export const InzhurCashReconciliation = ({ trackedBalance, value, onChange, instrumentSymbol }: Props) => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();

    const differenceLabel = formatDigits(value - trackedBalance, instrumentSymbol);
    const isDifferent = formatDigits(value) !== formatDigits(trackedBalance);
    const signedDifferenceLabel = value > trackedBalance ? `+${differenceLabel}` : differenceLabel;

    return (
        <View className="gap-y-md pb-5xl">
            <Text className="px-4 pt-md text-[13px] font-medium text-secondary-foreground">{t`Actual balance in Inzhur`}</Text>
            <FormAmountInput testID={CreateAccountSelector.Amount} value={value} instrumentSymbol={instrumentSymbol} onChange={onChange} />
            {isDifferent ? (
                <GroupedListSection>
                    <View accessible className="min-h-[44px] flex-row items-center gap-x-xl px-3xl py-md">
                        <Text className="flex-1 text-[15px] text-primary">{t`Tracked by Budgie`}</Text>
                        <ProtectedText className="text-[15px] text-secondary-foreground tabular-nums">
                            {formatDigits(trackedBalance, instrumentSymbol)}
                        </ProtectedText>
                    </View>
                    <View accessible className="min-h-[44px] flex-row items-center gap-x-xl px-3xl py-md">
                        <Text className="flex-1 text-[15px] text-primary">{t`Difference`}</Text>
                        <ProtectedText className="text-[15px] font-semibold text-primary tabular-nums">
                            {signedDifferenceLabel}
                        </ProtectedText>
                    </View>
                </GroupedListSection>
            ) : null}
        </View>
    );
};
