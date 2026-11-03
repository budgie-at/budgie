import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { useBottomChromeInset } from '@rnw-community/react-native-screen-chrome';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly description: string;
}

export const CategorizeInboxEmptyState = ({ description }: Props) => {
    const { t } = useLingui();
    const { chromeHeight } = useBottomChromeInset();

    const containerStyle = { paddingBottom: chromeHeight };

    return (
        <View className="flex-1 items-center justify-center px-5xl pt-safe" style={containerStyle}>
            <View className="size-[56px] items-center justify-center rounded-full bg-surface-disc">
                <Icon icon={UserIconNameEnum.Check} size={28} className="text-primary" />
            </View>
            <Text className="pt-3xl text-center text-[20px] leading-[25px] font-semibold text-primary" accessibilityRole="header">
                {t`All caught up`}
            </Text>
            <Text className="pt-xs text-center text-[15px] leading-[20px] text-secondary-foreground">{description}</Text>
        </View>
    );
};
