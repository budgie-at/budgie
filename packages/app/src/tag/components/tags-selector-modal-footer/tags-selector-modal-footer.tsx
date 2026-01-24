import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isPositiveNumber } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useThemeContext } from '../../../theme/context/theme.context';

const BG_LIGHT = '#FFFFFF';
const BG_DARK = '#000000';

interface Props {
    readonly selectedTagIds: number[];
    readonly onResolve: (tagIds: number[] | null) => void;
}

export const TagsSelectorModalFooter = ({ selectedTagIds, onResolve }: Props) => {
    const selectedTagsCount = selectedTagIds.length;
    const handleCancel = () => void onResolve(null);
    const handleDone = () => void onResolve(selectedTagIds);
    const { t } = useLingui();
    const { bottom } = useSafeAreaInsets();
    const { isDarkColorSchema } = useThemeContext();

    const buttonText = isPositiveNumber(selectedTagsCount) ? t`Done (${selectedTagsCount})` : t`Done`;
    const containerStyle = { paddingBottom: bottom, backgroundColor: isDarkColorSchema ? BG_DARK : BG_LIGHT };

    return (
        <View className="absolute bottom-0 left-0 right-0 gap-md pt-xl px-7xl border-t border-t-secondary-corner" style={containerStyle}>
            <View className="flex-row gap-x-xl">
                <HapticPressable
                    onPress={handleCancel}
                    className="bg-primary-reverse flex-1 rounded-5xl p-2xl border border-secondary-corner"
                >
                    <Text className="text-primary text-center">
                        <Trans>Cancel</Trans>
                    </Text>
                </HapticPressable>

                <HapticPressable
                    onPress={handleDone}
                    className="bg-primary flex-1 rounded-5xl p-2xl flex-row gap-x-md items-center justify-center"
                >
                    <Icon icon={UserIconNameEnum.Check} className="text-primary-reverse" size={16} />
                    <Text className="text-primary-reverse text-center">{buttonText}</Text>
                </HapticPressable>
            </View>
        </View>
    );
};
