import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../icon/icon';

interface Props {
    readonly query: string;
}

export const SelectorSearchEmptyState = ({ query }: Props) => {
    const { t } = useLingui();

    return (
        <View className="items-center gap-y-md px-5xl">
            <Icon icon={UserIconNameEnum.Search} size={40} className="text-secondary-foreground mb-xs" />
            <Text className="text-primary text-center text-[17px] font-semibold" numberOfLines={2}>
                {t`No results for “${query}”`}
            </Text>
            <Text className="text-secondary-foreground text-center text-[13px] leading-[18px]">
                <Trans>Check the spelling or try a code.</Trans>
            </Text>
        </View>
    );
};
