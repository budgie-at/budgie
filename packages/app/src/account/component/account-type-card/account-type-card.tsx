import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { ACCOUNT_ICON } from '../../constant/account-icon.constant';
import { ACCOUNT_TYPE_DESCRIPTION } from '../../constant/account-type-description.constant';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';

interface Props {
    readonly isSelected: boolean;
    readonly type: AccountTypeEnum;
    readonly onSelect: (type: AccountTypeEnum) => void;
}

const cardVariants = cva('flex-col flex-1', {
    variants: {
        isSelected: { true: 'border-primary' }
    }
});

export const AccountTypeCard = ({ type, onSelect, isSelected }: Props) => {
    const { i18n } = useLingui();

    const handleSelect = () => void onSelect(type);

    const variant = ACCOUNT_COLOR[type];
    const iconParams = { variant, border: false, size: 40, iconSize: 20 } as const;

    const right = isSelected ? <CircleIcon variant="ghost" iconSize={12} size={20} icon="Check" /> : null;

    return (
        <SimpleHorizontalCell
            right={right}
            onPress={handleSelect}
            iconParams={iconParams}
            contentClassName="items-center"
            icon={ACCOUNT_ICON[type]}
            title={i18n.t(ACCOUNT_TYPE[type])}
            className={cardVariants({ isSelected })}
            description={i18n.t(ACCOUNT_TYPE_DESCRIPTION[type])}
        />
    );
};
