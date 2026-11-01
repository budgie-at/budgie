import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly description: string;
    readonly onDone: () => void;
}

export const CategorizeInboxEmptyState = ({ description, onDone }: Props) => {
    const { t } = useLingui();

    return (
        <View className="flex-1 items-center justify-center px-5xl pt-safe">
            <View className="size-[56px] items-center justify-center rounded-full bg-surface-disc">
                <Icon icon={UserIconNameEnum.Check} size={28} className="text-primary" />
            </View>
            <Text className="pt-3xl text-center text-[20px] leading-[25px] font-semibold text-primary" accessibilityRole="header">
                {t`All caught up`}
            </Text>
            <Text className="pt-xs text-center text-[15px] leading-[20px] text-secondary-foreground">{description}</Text>
            <Button variant="primary" content={t`Done`} onPress={onDone} className="mt-7xl self-stretch" />
        </View>
    );
};
