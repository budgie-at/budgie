import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useCallback, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '../../../@generic/component/bottom-sheet-header/bottom-sheet-header';
import { BottomSheetView } from '../../../@generic/component/bottom-sheet-view/bottom-sheet-view';
import { Button } from '../../../@generic/component/button/button';
import { Footer } from '../../../@generic/component/footer/footer';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';

import { AccountTypeOption } from './account-type-option';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly currentType: AccountTypeEnum;
    readonly onSelect: (type: AccountTypeEnum) => void;
}

const LIABILITY_ACCOUNT_TYPES = [
    AccountTypeEnum.BANK,
    AccountTypeEnum.CASH,
    AccountTypeEnum.SAVINGS,
    AccountTypeEnum.CRYPTO,
    AccountTypeEnum.STOCKS
];

const ANIMATION_DURATION = 200;

export const AccountTypeBottomSheet = ({ ref, currentType, onSelect }: Props) => {
    const { t } = useLingui();
    const [selectedType, setSelectedType] = useState<AccountTypeEnum>(currentType);
    const hasChanges = selectedType !== currentType;

    const handleSelectType = useCallback((type: AccountTypeEnum) => {
        setSelectedType(type);
    }, []);

    const handleConfirm = useCallback(() => {
        onSelect(selectedType);
        ref.current?.dismiss();
    }, [onSelect, selectedType, ref]);

    const handleDismiss = useCallback(() => {
        setSelectedType(currentType);
    }, [currentType]);

    const variant = ACCOUNT_COLOR[selectedType];

    return (
        <BottomSheet ref={ref} enableDynamicSizing onDismiss={handleDismiss}>
            <BottomSheetView>
                <BottomSheetHeader size="md" title={t`Account Type`} description={t`Select the type of account`} />

                <Animated.View layout={LinearTransition.duration(ANIMATION_DURATION)} className="gap-y-lg px-xl pb-xl">
                    {LIABILITY_ACCOUNT_TYPES.map(type => (
                        <Animated.View key={type} layout={LinearTransition.duration(ANIMATION_DURATION)}>
                            <AccountTypeOption type={type} isSelected={selectedType === type} onSelect={handleSelectType} />
                        </Animated.View>
                    ))}
                </Animated.View>

                {hasChanges ? (
                    <Animated.View entering={FadeIn.duration(ANIMATION_DURATION)} exiting={FadeOut.duration(ANIMATION_DURATION)}>
                        <Footer>
                            <Button onPress={handleConfirm} size="sm" variant={variant} content={t`Change Account Type`} />
                        </Footer>
                    </Animated.View>
                ) : (
                    <View className="pb-10xl" />
                )}
            </BottomSheetView>
        </BottomSheet>
    );
};
