import { CurrencyEnum } from '@budgie/contracts';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Trans, useLingui } from '@lingui/react/macro';
import { useImperativeHandle, useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { EmptyFn, isNotEmptyArray } from '@rnw-community/shared';

import { CURRENCIES } from '../../constant/currencies.constant';
import { CurrencyDetails } from '../../interface/currency-details.interface';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { CurrencySelectorCard } from '../currency-selector-card/currency-selector-card';

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { Ref } from 'react';

interface Props {
    readonly onSelect: (currency: CurrencyEnum) => void;
    readonly ref: Ref<{ open: EmptyFn }>;
    readonly selectedCurrency: CurrencyEnum;
    readonly closeOnSelect?: boolean;
}

// const FlatList = styled(BottomSheetFlatList, { contentContainerClassName: 'contentContainerStyle' });

const snapPoints = ['70%'];

export const CurrencySelectorBottomSheet = ({ ref, selectedCurrency, onSelect, closeOnSelect }: Props) => {
    const [search, setSearch] = useState('');
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const { t } = useLingui();

    const filteredCurrencies = CURRENCIES.filter(
        ({ name, code }) => name.toLowerCase().includes(search.toLowerCase()) || code.toLowerCase().includes(search.toLowerCase())
    );

    useImperativeHandle(ref, () => ({
        open: () => {
            bottomSheetRef.current?.present();
        }
    }));

    const handleSelect = (currency: CurrencyEnum) => {
        onSelect(currency);

        if (closeOnSelect) {
            bottomSheetRef.current?.close();
        }
    };

    const keyExtractor = (item: CurrencyDetails) => item.code;

    const renderItem = ({ item }: { item: CurrencyDetails }) => (
        <CurrencySelectorCard
            emoji={item.emoji}
            key={item.code}
            isSelected={item.code === selectedCurrency}
            code={item.code}
            symbol={item.symbol}
            name={item.name}
            onSelect={handleSelect}
        />
    );

    return (
        <BottomSheet ref={bottomSheetRef} snapPoints={snapPoints}>
            <View className="pt-[16px] pb-[30px]">
                <View className="gap-y-1 mb-[50px]">
                    <Text className="text-[20px] text-primary font-semibold">
                        <Trans>Select Currency</Trans>
                    </Text>
                    <Text className="text-[14px] text-secondary-foreground">
                        <Trans>Choose your main currency</Trans>
                    </Text>
                </View>

                <BottomSheetTextInput
                    className="rounded-[20px] bg-secondary-background h-[44px] px-[12px] border border-secondary-corner placeholder-secondary-reverse-foreground text-primary"
                    onChangeText={setSearch}
                    placeholder={t`Search currencies...`}
                    value={search}
                />
            </View>

            {isNotEmptyArray(filteredCurrencies) ? (
                <FlatList
                    data={filteredCurrencies}
                    contentContainerClassName={'gap-y-[10px]'}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View className={'items-center gap-y-[9.5px] py-[50px]'}>
                    <Text className={'text-secondary-foreground text-[16px]'}>
                        <Trans>No currencies found</Trans>
                    </Text>
                    <Text className={'text-secondary-foreground text-[12px]'}>
                        <Trans>Try a different search term</Trans>
                    </Text>
                </View>
            )}
        </BottomSheet>
    );
};
