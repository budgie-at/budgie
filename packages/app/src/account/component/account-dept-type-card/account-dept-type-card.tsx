import { AccountDebtTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { ACCOUNT_DEBT_TYPE_DESCRIPTION } from '../../constant/account-debt-type-description.constant';
import { ACCOUNT_DEBT_TYPE_ICON } from '../../constant/account-debt-type-icon.constant';
import { ACCOUNT_DEBT_TYPE } from '../../constant/account-debt-type.constant';

interface Props {
    readonly isSelected: boolean;
    readonly type: AccountDebtTypeEnum;
    readonly onSelect: (type: AccountDebtTypeEnum) => void;
}

const cardVariants = cva('flex-col flex-1', {
    variants: {
        isSelected: { true: 'border-primary' }
    }
});

export const AccountDeptTypeCard = ({ type, onSelect, isSelected }: Props) => {
    const { t } = useLingui();

    const handleSelect = () => void onSelect(type);

    const right = isSelected ? <CircleIcon variant="ghost" iconSize={12} size={20} icon={UserIconNameEnum.Check} /> : null;

    return (
        <SimpleHorizontalCell
            right={right}
            onPress={handleSelect}
            left={<CircleIcon icon={ACCOUNT_DEBT_TYPE_ICON[type]} variant="ghost" border={false} size={40} iconSize={20} />}
            contentClassName="items-center"
            title={t(ACCOUNT_DEBT_TYPE[type])}
            className={cardVariants({ isSelected })}
            description={t(ACCOUNT_DEBT_TYPE_DESCRIPTION[type])}
        />
    );
};
