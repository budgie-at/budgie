import { UserIconNameEnum } from '@budgie/contracts';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SelectorCard } from '../../../@generic/component/selector-card/selector-card';
import { AccountSelectorModalSelector } from '../../../app/account-selector-modal.selector';

import type { AccountSelectorCreateActionInterface } from '../../interface/account-selector-create-action.interface';

interface Props {
    readonly title: AccountSelectorCreateActionInterface['title'];
    readonly subtitle: AccountSelectorCreateActionInterface['subtitle'];
    readonly onCreate: () => void;
}

export const AccountSelectorCreateActionCard = ({ title, subtitle, onCreate }: Props) => (
    <SelectorCard
        identifier={0}
        isSelected={false}
        allowReselect
        onSelect={onCreate}
        className="mb-sm"
        testID={AccountSelectorModalSelector.CreateAction}
        iconSlot={
            <CircleIcon size={48} iconSize={24} className="rounded-5xl" icon={UserIconNameEnum.Plus} variant="positive" border={false} />
        }
        title={title}
        subtitle={
            <Text className="text-secondary-foreground text-xs flex-shrink" numberOfLines={1}>
                {subtitle}
            </Text>
        }
    />
);
