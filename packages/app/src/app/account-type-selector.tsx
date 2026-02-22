import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Button } from '../@generic/component/button/button';
import { Footer } from '../@generic/component/footer/footer';
import { FormsheetHeader } from '../@generic/component/formsheet-header/formsheet-header';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { AccountTypeOption } from '../account/component/account-type-option/account-type-option';
import { ACCOUNT_COLOR } from '../account/constant/account-color.constant';
import { useAccountTypeSelectorModal } from '../account/context/account-type-selector-modal.context';

const ACCOUNT_TYPES = [AccountTypeEnum.BANK, AccountTypeEnum.CASH, AccountTypeEnum.SAVINGS, AccountTypeEnum.CRYPTO, AccountTypeEnum.STOCKS];

const ANIMATION_DURATION = 200;

export default function AccountTypeSelectorModal() {
    const { t } = useLingui();
    const [, resolveAccountTypeSelector, currentParams] = useAccountTypeSelectorModal();
    const { backgroundColor } = useFormsheetListStyles();

    const initialType = currentParams?.currentType ?? AccountTypeEnum.BANK;
    const [selectedType, setSelectedType] = useState<AccountTypeEnum>(initialType);

    const hasChanges = selectedType !== initialType;
    const variant = ACCOUNT_COLOR[selectedType];
    const containerStyle = { flex: 1, backgroundColor };

    const handleSelectType = (type: AccountTypeEnum) => void setSelectedType(type);

    const handleConfirm = () => {
        resolveAccountTypeSelector(selectedType);
    };

    return (
        <View style={containerStyle}>
            <FormsheetHeader size="md" title={t`Account Type`} description={t`Select the type of account`} />

            <Animated.View layout={LinearTransition.duration(ANIMATION_DURATION)} className="gap-y-lg px-3xl pb-xl">
                {ACCOUNT_TYPES.map(type => (
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
        </View>
    );
}
