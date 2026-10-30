import { Trans, useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';

import type { Href } from 'expo-router';

interface Props {
    readonly editHref: Href | null;
}

export const TransactionInfoEditButton = ({ editHref }: Props) => {
    const router = useRouter();
    const { t } = useLingui();
    const handleEditPress = () => {
        if (isDefined(editHref)) {
            router.push(editHref);
        }
    };

    if (!isDefined(editHref)) {
        return null;
    }

    return (
        <HapticPressable
            accessibilityRole="button"
            accessibilityLabel={t`Edit transaction`}
            className="min-h-[44px] min-w-[44px] items-center justify-center active:scale-100 active:opacity-70"
            disabled={!isDefined(editHref)}
            onPress={handleEditPress}
            testID={TransactionInfoPageSelector.EditButton}
        >
            <Text
                maxFontSizeMultiplier={1.35}
                className="text-[17px] text-default-foreground font-medium"
                testID={`${TransactionInfoPageSelector.EditButton}.Label`}
            >
                <Trans>Edit</Trans>
            </Text>
        </HapticPressable>
    );
};
