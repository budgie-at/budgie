import { AccountAssociationEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { SelectorCard } from '../../../@generic/component/selector-card/selector-card';
import { AccountSelectorModalSelector } from '../../../app/account-selector-modal.selector';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { AccountInactiveIcon } from '../account-inactive-icon/account-inactive-icon';

interface Props extends Pick<
    AccountWithInstrumentEntityInterface,
    'id' | 'icon' | 'type' | 'title' | 'isActive' | AccountAssociationEnum.INSTRUMENT
> {
    readonly onSelect: (id: number) => void;
    readonly isSelected: boolean;
    readonly className?: string;
}

export const AccountSelectorCard = (props: Props) => {
    const { className, isSelected, title, onSelect, id, icon, type, instrument, isActive } = props;

    const { t } = useLingui();
    const { decimalPlaces } = useSettingsContext();
    const { balance } = useAccountBalanceQuery(id);
    const formatDigits = useFormatDigits(decimalPlaces);
    const optionTestID = AccountSelectorModalSelector.Option(title);

    return (
        <SelectorCard
            identifier={id}
            isSelected={isSelected}
            allowReselect
            onSelect={onSelect}
            className={className}
            testID={optionTestID}
            accessible
            accessibilityLabel={title}
            accessibilityRole="button"
            iconSlot={
                <AccountInactiveIcon isInactive={!isActive} size={48}>
                    <CircleIcon size={48} iconSize={24} className="rounded-5xl" icon={icon} variant="ghost" border={false} />
                </AccountInactiveIcon>
            }
            title={title}
            subtitle={
                <View className="flex-row items-center">
                    <Text className="text-secondary-foreground text-xs flex-shrink" numberOfLines={1}>
                        {t(ACCOUNT_TYPE[type])}
                    </Text>
                    <Text className="text-secondary-foreground text-xs">&nbsp;•&nbsp;</Text>
                    <ProtectedText className="text-sm font-medium text-primary" numberOfLines={1}>
                        {formatDigits(balance, instrument.symbol)}
                    </ProtectedText>
                </View>
            }
        />
    );
};
