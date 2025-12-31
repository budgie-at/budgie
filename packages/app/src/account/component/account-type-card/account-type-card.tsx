import { AccountTypeEnum } from '@budgie/contracts';

import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { ACCOUNT_ICON } from '../../constant/account-icon.constant';
import { ACCOUNT_TYPE_DESCRIPTION } from '../../constant/account-type-description.constant';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { SelectableTypeCard } from '../selectable-type-card/selectable-type-card';

interface Props {
    readonly isSelected: boolean;
    readonly type: AccountTypeEnum;
    readonly onSelect: (type: AccountTypeEnum) => void;
}

export const AccountTypeCard = ({ type, onSelect, isSelected }: Props) => {
    const variant = ACCOUNT_COLOR[type];

    return (
        <SelectableTypeCard
            type={type}
            onSelect={onSelect}
            isSelected={isSelected}
            icon={ACCOUNT_ICON[type]}
            title={ACCOUNT_TYPE[type]}
            description={ACCOUNT_TYPE_DESCRIPTION[type]}
            iconVariant={variant}
        />
    );
};
