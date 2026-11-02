import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { AccountSelectorModalSelector } from '../../../app/account-selector-modal.selector';

import type { AccountSelectorCreateActionInterface } from '../../interface/account-selector-create-action.interface';

interface Props {
    readonly title: AccountSelectorCreateActionInterface['title'];
    readonly subtitle: AccountSelectorCreateActionInterface['subtitle'];
    readonly onCreate: () => void;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const AccountSelectorCreateActionCard = ({ title, subtitle, onCreate }: Props) => (
    <View className="mb-5xl overflow-hidden rounded-3xl bg-surface-row" style={CONTINUOUS_CORNERS}>
        <View className="-mt-px">
            <GroupedListRow
                onPress={onCreate}
                testID={AccountSelectorModalSelector.CreateAction}
                left={<CircleIcon size={36} iconSize={18} radius={18} icon={UserIconNameEnum.Plus} variant="positive" border={false} />}
                title={title}
                subtitle={subtitle}
            />
        </View>
    </View>
);
