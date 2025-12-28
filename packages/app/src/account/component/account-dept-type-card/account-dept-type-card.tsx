import { AccountDebtTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ACCOUNT_DEBT_TYPE_DESCRIPTION } from '../../constant/account-debt-type-description.constant';
import { ACCOUNT_DEBT_TYPE_ICON } from '../../constant/account-debt-type-icon.constant';
import { ACCOUNT_DEBT_TYPE } from '../../constant/account-debt-type.constant';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';

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
    const { i18n } = useLingui();

    const handleSelect = () => void onSelect(type);

    const iconParams = { variant: 'ghost', border: false, size: 40, iconSize: 20 } as const;

    const right = isSelected ? <CircleIcon variant="ghost" iconSize={12} size={20} icon="Check" /> : null;

    return (
        <SimpleHorizontalCell
            right={right}
            onPress={handleSelect}
            iconParams={iconParams}
            contentClassName="items-center"
            icon={ACCOUNT_DEBT_TYPE_ICON[type]}
            title={i18n.t(ACCOUNT_DEBT_TYPE[type])}
            className={cardVariants({ isSelected })}
            description={i18n.t(ACCOUNT_DEBT_TYPE_DESCRIPTION[type])}
        />
    );
};
