import { AccountAssociationEnum, AccountTypeEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { SelectorRow } from '../../../@generic/component/selector-row/selector-row';
import { cn } from '../../../@generic/utils/cn.util';
import { AccountSelectorModalSelector } from '../../../app/account-selector-modal.selector';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { getAccountDisplayTitle } from '../../utils/get-account-display-title.util';
import { AccountInactiveIcon } from '../account-inactive-icon/account-inactive-icon';
import { AccountSelectorCardDebtTotalSubtitle } from '../account-selector-card-debt-total-subtitle/account-selector-card-debt-total-subtitle';

interface Props {
    readonly account: Pick<
        AccountWithInstrumentEntityInterface,
        'id' | 'icon' | 'type' | 'title' | 'externalId' | 'isActive' | 'debtType' | 'targetBalance' | AccountAssociationEnum.INSTRUMENT
    >;
    readonly onSelect: (id: number) => void;
    readonly isSelected: boolean;
    readonly showDebtTotal: boolean;
}

export const AccountSelectorCard = (props: Props) => {
    const { account, isSelected, onSelect, showDebtTotal } = props;
    const { title, id, icon, type, instrument, isActive, debtType, targetBalance } = account;

    const { t } = useLingui();
    const displayTitle = getAccountDisplayTitle(account);
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
        <Text className="text-secondary-foreground text-[13px] leading-[18px]" maxFontSizeMultiplier={2}>
            {t(ACCOUNT_TYPE[type])} · <ProtectedText>{formatDigits(balance, instrument.symbol)}</ProtectedText>
        </Text>
    );

    return (
        <SelectorRow
            isSelected={isSelected}
            onPress={handleSelect}
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
            title={
                <Text
                    className={cn('text-primary text-[17px] leading-[22px]', isSelected && 'font-semibold')}
                    maxFontSizeMultiplier={1.75}
                    testID={AccountSelectorModalSelector.Option(title)}
                >
                    {displayTitle}
                </Text>
            }
            subtitle={subtitle}
        />
    );
};
