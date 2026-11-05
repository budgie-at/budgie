import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View, useWindowDimensions } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';
import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { TRANSACTION_LARGE_TEXT_SCALE } from '../../constant/transaction-large-text-scale.constant';
import { TransferQuickFormSelector } from '../transfer-quick-form/transfer-quick-form.selector';

import type { ConversionRow } from '../conversion-row/conversion-row';
import type { ComponentProps } from 'react';

export const ConvertTransferRateRow = (props: ComponentProps<typeof ConversionRow>) => {
    const { t } = useLingui();
    const { fontScale } = useWindowDimensions();
    const isProtected = useIsAmountProtected();
    const formatAmount = useFormatDigits(2);
    const formatRate = useFormatDigits(0, 6);
    const amount = isProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatAmount(props.destinationAmount, props.destinationSymbol);
    const displayAmount = props.isManualRate ? amount : `≈ ${amount}`;
    const { sourceCode, destinationCode } = props;
    const formattedRate = formatRate(props.exchangeRate);
    const rateLabel = t`1 ${sourceCode} = ${formattedRate} ${destinationCode}`;
    const titleClassName = fontScale >= TRANSACTION_LARGE_TEXT_SCALE ? 'gap-y-xxs' : 'flex-row items-center justify-between gap-x-lg';
    const pressableProps = { accessibilityLabel: `${props.label}: ${displayAmount}. ${rateLabel}`, accessibilityHint: t`Edit the amount` };

    return (
        <GroupedListRow
            left={<Icon icon={UserIconNameEnum.Banknote} size={20} className="m-[8px] text-secondary-foreground" />}
            title={
                <View className={titleClassName}>
                    <Text className="text-secondary-foreground text-[15px] leading-[20px]" maxFontSizeMultiplier={1.5}>
                        {props.label}
                    </Text>
                    <Text className="text-primary text-[17px] leading-[22px]" maxFontSizeMultiplier={2}>
                        {displayAmount}
                    </Text>
                </View>
            }
            subtitle={
                <Text className="text-secondary-foreground pt-xxs text-[13px] leading-[18px]" maxFontSizeMultiplier={2}>
                    {rateLabel}
                </Text>
            }
            onPress={props.onPress}
            pressableProps={pressableProps}
            testID={TransferQuickFormSelector.ConversionRow}
        />
    );
};
