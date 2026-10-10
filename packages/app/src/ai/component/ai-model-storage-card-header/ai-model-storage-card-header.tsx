import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';

interface Props {
    readonly isLoading: boolean;
    readonly description: string;
}

export const AiModelStorageCardHeader = ({ isLoading, description }: Props) => {
    const { t } = useLingui();

    return (
        <View className="flex-row items-start gap-x-2xl">
            <CircleIcon icon={UserIconNameEnum.HardDrive} variant="ghost" border={false} size={40} iconSize={20} />

            <View className="flex-1 gap-y-xs">
                <Text className="text-primary text-base font-semibold">{t`Downloaded AI models`}</Text>
                <Text className="text-secondary-foreground text-sm">{isLoading ? t`Checking storage...` : description}</Text>
            </View>
        </View>
    );
};
