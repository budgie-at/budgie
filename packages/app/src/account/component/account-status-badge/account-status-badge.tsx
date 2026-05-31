import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { AccountVisibilityStatusEnum } from '../../enum/account-visibility-status.enum';

interface Props {
    readonly status: AccountVisibilityStatusEnum;
}

export const AccountStatusBadge = ({ status }: Props) => {
    if (status === AccountVisibilityStatusEnum.ACTIVE) {
        return null;
    }

    const isArchived = status === AccountVisibilityStatusEnum.ARCHIVED;
    const icon = isArchived ? UserIconNameEnum.Archive : UserIconNameEnum.EyeOff;

    return (
        <View className="flex-row items-center gap-xxs self-start rounded-full bg-secondary-corner px-sm py-xxs">
            <Icon icon={icon} size={10} className="text-secondary-foreground" />
            <Text className="text-xxs font-semibold uppercase tracking-wide text-secondary-foreground">
                {isArchived ? <Trans>Archived</Trans> : <Trans>Inactive</Trans>}
            </Text>
        </View>
    );
};
