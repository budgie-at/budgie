import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';

import type { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly onRetry: EmptyFn;
}

export const CreateBankSearchRetryRow = ({ onRetry }: Props) => {
    const { t } = useLingui();
    const pressableProps = { accessibilityHint: t`Loads the bank list again` };

    return (
        <GroupedListRow
            left={<GroupedListIcon icon={UserIconNameEnum.TriangleAlert} iconClassName="text-secondary-foreground" />}
            title={
                <Text className="text-default-foreground text-[17px]" numberOfLines={2}>
                    {t`Try again`}
                </Text>
            }
            subtitle={t`Couldn’t load this list`}
            right={<Icon icon={UserIconNameEnum.RotateCw} size={16} className="text-default-foreground" />}
            onPress={onRetry}
            pressableProps={pressableProps}
        />
    );
};
