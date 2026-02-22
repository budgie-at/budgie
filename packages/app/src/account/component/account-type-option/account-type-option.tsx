import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SelectorCard } from '../../../@generic/component/selector-card/selector-card';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { ACCOUNT_ICON } from '../../constant/account-icon.constant';
import { ACCOUNT_TYPE_DESCRIPTION } from '../../constant/account-type-description.constant';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';

interface Props {
    readonly type: AccountTypeEnum;
    readonly isSelected: boolean;
    readonly onSelect: (type: AccountTypeEnum) => void;
}

export const AccountTypeOption = ({ type, isSelected, onSelect }: Props) => {
    const { t } = useLingui();
    const variant = ACCOUNT_COLOR[type];

    const handleSelect = (selectedType: AccountTypeEnum) => void onSelect(selectedType);

    const iconSlot = (
        <CircleIcon icon={ACCOUNT_ICON[type]} variant={variant} size={48} iconSize={24} className="rounded-5xl" border={false} />
    );

    const subtitle = <Text className="text-secondary-foreground text-xs">{t(ACCOUNT_TYPE_DESCRIPTION[type])}</Text>;

    return (
        <SelectorCard
            identifier={type}
            isSelected={isSelected}
            onSelect={handleSelect}
            iconSlot={iconSlot}
            title={t(ACCOUNT_TYPE[type])}
            subtitle={subtitle}
        />
    );
};
