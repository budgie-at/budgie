import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { SettingsRowAccessoryKindEnum } from '../../enum/settings-row-accessory-kind.enum';

interface Props {
    readonly value?: string;
    readonly kind?: SettingsRowAccessoryKindEnum;
    readonly isLoading?: boolean;
    readonly testID?: string;
}

const KIND_ICON: Record<SettingsRowAccessoryKindEnum, UserIconNameEnum | null> = {
    [SettingsRowAccessoryKindEnum.NAVIGATE]: UserIconNameEnum.ChevronRight,
    [SettingsRowAccessoryKindEnum.EXTERNAL]: UserIconNameEnum.ArrowUpRight,
    [SettingsRowAccessoryKindEnum.ACTION]: null,
    [SettingsRowAccessoryKindEnum.VALUE]: null
};

export const SettingsRowAccessory = ({ value, kind = SettingsRowAccessoryKindEnum.NAVIGATE, isLoading = false, testID }: Props) => {
    const icon = KIND_ICON[kind];

    return (
        <LoadingContent isLoading={isLoading} containerClassName="max-w-[50%] shrink" className="min-h-[20px] min-w-[20px] items-end justify-center">
            <View className="flex-row items-center gap-x-xs">
                {isNotEmptyString(value) ? (
                    <Text className="shrink text-secondary-foreground text-right text-[17px]" testID={testID}>
                        {value}
                    </Text>
                ) : null}
                {isDefined(icon) ? <Icon icon={icon} size={16} className="text-secondary-foreground" /> : null}
            </View>
        </LoadingContent>
    );
};
