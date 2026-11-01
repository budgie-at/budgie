import { AccountAssociationEnum, AccountTypeEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { SelectorRow } from '../../../@generic/component/selector-row/selector-row';
import { AccountSelectorModalSelector } from '../../../app/account-selector-modal.selector';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { AccountInactiveIcon } from '../account-inactive-icon/account-inactive-icon';
import { AccountSelectorCardDebtTotalSubtitle } from '../account-selector-card-debt-total-subtitle/account-selector-card-debt-total-subtitle';

interface Props extends Pick<
    AccountWithInstrumentEntityInterface,
    'id' | 'icon' | 'type' | 'title' | 'isActive' | 'debtType' | 'targetBalance' | AccountAssociationEnum.INSTRUMENT
> {
    readonly onSelect: (id: number) => void;
    readonly isSelected: boolean;
    readonly showDebtTotal: boolean;
}

export const AccountSelectorCard = (props: Props) => {
    const { isSelected, title, onSelect, id, icon, type, instrument, isActive, debtType, targetBalance, showDebtTotal } = props;

    const { t } = useLingui();
    const { balance } = useAccountBalanceQuery(id);
    const formatDigits = useDisplayFormatDigits();
    const handleSelect = () => void onSelect(id);
    const shouldShowDebtTotal = showDebtTotal && type === AccountTypeEnum.DEBT;
    const subtitle = shouldShowDebtTotal ? (
        <AccountSelectorCardDebtTotalSubtitle
            accountId={id}
            debtType={debtType}
            instrumentSymbol={instrument.symbol}
            targetBalance={targetBalance}
            title={title}
        />
    ) : (
        <View className="flex-row items-center">
            <Text className="text-secondary-foreground text-[13px] leading-[18px] flex-shrink" numberOfLines={1}>
                {t(ACCOUNT_TYPE[type])} ·{' '}
            </Text>
            <ProtectedText className="text-secondary-foreground text-[13px] leading-[18px] tabular-nums" numberOfLines={1}>
                {formatDigits(balance, instrument.symbol)}
            </ProtectedText>
        </View>
    );

    return (
        <SelectorRow
            isSelected={isSelected}
            onPress={handleSelect}
            titleTestID={AccountSelectorModalSelector.Option(title)}
            left={
                <AccountInactiveIcon isInactive={!isActive} size={36}>
                    <CircleIcon
                        size={36}
                        iconSize={18}
                        radius={18}
                        className="bg-surface-disc"
                        icon={icon}
                        variant="secondary"
                        border={false}
                    />
                </AccountInactiveIcon>
            }
            title={title}
            subtitle={subtitle}
        />
    );
};
