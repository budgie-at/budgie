import { CurrencyEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { CURRENCIES, DEFAULT_CURRENCY } from '../../constant/currencies.constant';
import { ICONS } from '../../constant/icons.constant';
import { CurrencySelectorBottomSheet } from '../currency-selector-bottom-sheet/currency-selector-bottom-sheet';
import { Icon } from '../icon/icon';

interface Props {
    currencyCode: CurrencyEnum;
    onCurrencyCodeSelect: (currency: CurrencyEnum) => void;
}

export const CurrencySelector = ({ currencyCode, onCurrencyCodeSelect }: Props) => {
    const ref = useRef<{ open: EmptyFn }>(null);

    const selectedCurrency = CURRENCIES.find(({ code }) => code === currencyCode) ?? DEFAULT_CURRENCY;

    const handleOpen = () => void ref.current?.open();

    return (
        <>
            <Pressable
                onPress={handleOpen}
                className={'rounded-[16px] border border-secondary-corner p-[16px] flex-row gap-x-[12px] items-center'}
            >
                <View className={'rounded-[20px] bg-secondary-background p-[10px]'}>
                    <Text>{selectedCurrency.emoji}</Text>
                </View>

                <View className={'gap-y-[4px] flex-1'}>
                    <Text className={'text-primary font-medium text-[15px]'}>
                        {selectedCurrency.name}
                        <Text> {selectedCurrency.code}</Text>
                    </Text>
                    <Text className={'text-[14px] text-secondary-foreground'}>
                        <Trans>Base currency</Trans>
                    </Text>
                </View>

                <Icon icon={ICONS.Sparkles} className={'text-secondary-foreground/50'} size={16} />
            </Pressable>

            <CurrencySelectorBottomSheet selectedCurrency={currencyCode} onSelect={onCurrencyCodeSelect} ref={ref} />
        </>
    );
};
