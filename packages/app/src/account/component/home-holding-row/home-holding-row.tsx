import { cva } from 'class-variance-authority';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { CurrencySelectorInstrumentIcon } from '../../../@generic/component/currency-selector-instrument-icon/currency-selector-instrument-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { HomeHoldingRowAmount } from '../home-holding-row-amount/home-holding-row-amount';
import { HomeHoldingRowCaption } from '../home-holding-row-caption/home-holding-row-caption';

import { HomeHoldingRowSelector } from './home-holding-row.selector';

import type { HoldingReturnInterface } from '../../interface/holding-return.interface';
import type { HomeHoldingInterface } from '../../interface/home-holding.interface';
import type { AccountTypeEnum } from '@budgie/contracts';

interface Props {
    readonly holding: HomeHoldingInterface;
    readonly holdingReturn: HoldingReturnInterface | undefined;
    readonly sectionType: AccountTypeEnum;
    readonly isReturnLoading: boolean;
}

const rowVariants = cva('min-h-[64px] gap-x-xl py-lg pr-xl pl-3xl active:bg-surface-fill', {
    variants: { isStacked: { true: 'gap-y-sm', false: 'flex-row items-center' } }
});

export const HomeHoldingRow = ({ holding, holdingReturn, sectionType, isReturnLoading }: Props) => {
    const { instrument } = holding;

    const isStacked = useIsAccessibilityTextSize();

    const handlePress = () => void router.push({ pathname: '/currency/[id]', params: { id: String(instrument.id) } });

    return (
        <HapticPressable
            pressedScale={1}
            accessible
            accessibilityRole="button"
            onPress={handlePress}
            className={rowVariants({ isStacked })}
            testID={HomeHoldingRowSelector.Row(instrument.code)}
        >
            <CurrencySelectorInstrumentIcon code={instrument.code} symbol={instrument.symbol} type={instrument.type} size={44} />

            <View className="min-w-0 flex-1 gap-y-xxs">
                <Text
                    className="text-[17px] font-semibold text-primary"
                    maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                    ellipsizeMode="tail"
                    numberOfLines={2}
                >
                    {instrument.name}
                </Text>
                <HomeHoldingRowCaption holding={holding} sectionType={sectionType} />
            </View>

            <HomeHoldingRowAmount holding={holding} holdingReturn={holdingReturn} isReturnLoading={isReturnLoading} />
        </HapticPressable>
    );
};
