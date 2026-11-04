import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import { useResolveClassNames } from 'uniwind';

import { ScreenChromeHeader } from '@rnw-community/react-native-screen-chrome';

import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';

interface Props {
    readonly onGoBack: () => void;
}

export const ImportScreenHeader = ({ onGoBack }: Props) => {
    const { t } = useLingui();
    const style = useResolveClassNames('bg-surface');

    return (
        <ScreenChromeHeader style={style}>
            <View className="absolute inset-0 items-center justify-center px-[60px]" pointerEvents="none">
                <Text className="text-primary text-[17px] font-semibold" accessibilityRole="header">
                    {t`Map CSV columns`}
                </Text>
            </View>
            <GoBackButton onPress={onGoBack} />
        </ScreenChromeHeader>
    );
};
