import { AccountDebtTypeEnum } from '@budgie/contracts';

import { ACCOUNT_DEBT_TYPE_DESCRIPTION } from '../../constant/account-debt-type-description.constant';
import { ACCOUNT_DEBT_TYPE_ICON } from '../../constant/account-debt-type-icon.constant';
import { ACCOUNT_DEBT_TYPE } from '../../constant/account-debt-type.constant';
import { SelectableTypeCard } from '../selectable-type-card/selectable-type-card';

interface Props {
    readonly isSelected: boolean;
    readonly type: AccountDebtTypeEnum;
    readonly onSelect: (type: AccountDebtTypeEnum) => void;
}

export const AccountDeptTypeCard = ({ type, onSelect, isSelected }: Props) => (
    <SelectableTypeCard
        type={type}
        onSelect={onSelect}
        isSelected={isSelected}
        icon={ACCOUNT_DEBT_TYPE_ICON[type]}
        title={ACCOUNT_DEBT_TYPE[type]}
        description={ACCOUNT_DEBT_TYPE_DESCRIPTION[type]}
    />
);
