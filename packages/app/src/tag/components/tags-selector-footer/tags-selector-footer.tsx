import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { Footer } from '../../../@generic/component/footer/footer';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly selectedTagsCount: number;
    readonly onClose: () => void;
}

export const TagsSelectorFooter = ({ selectedTagsCount, onClose }: Props) => {
    const { t } = useLingui();
    const buttonText = isPositiveNumber(selectedTagsCount) ? t`Done (${selectedTagsCount})` : t`Done`;

    return (
        <Footer>
            <View className="flex-row gap-x-xl">
                <HapticPressable onPress={onClose} className="bg-primary-reverse flex-1 rounded-5xl p-2xl border border-secondary-corner">
                    <Text className="text-primary text-center">
                        <Trans>Cancel</Trans>
                    </Text>
                </HapticPressable>

                <HapticPressable
                    onPress={onClose}
                    className="bg-primary flex-1 rounded-5xl p-2xl flex-row gap-x-md items-center justify-center"
                >
                    <Icon icon={UserIconNameEnum.Check} className="text-primary-reverse" size={16} />

                    <Text className="text-primary-reverse text-center">{buttonText}</Text>
                </HapticPressable>
            </View>
        </Footer>
    );
};
