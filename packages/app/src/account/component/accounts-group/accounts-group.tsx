import { AccountTypeEnum, AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { TransactionFiltersSelectors } from '../../../@e2e/selectors/transaction-filters.selector';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ACCOUNT_ICON } from '../../constant/account-icon.constant';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { AccountFilterCard } from '../account-filter-card/account-filter-card';

interface Props {
    readonly type: AccountTypeEnum;
    readonly selectedAccountIds: number[];
    readonly onSelect: (...accountIds: number[]) => void;
    readonly accounts: AccountWithInstrumentEntityInterface[];
}

const cardVariants = cva('rounded-5xl border border-secondary-corner overflow-hidden', {
    variants: {
        isAllSelected: {
            true: 'bg-secondary-corner'
        },
        isPartiallySelected: {
            true: 'bg-secondary-corner/50'
        }
    },
    compoundVariants: [
        {
            isAllSelected: false,
            isPartiallySelected: false,
            className: 'bg-secondary-background'
        }
    ]
});

export const AccountsGroup = ({ type, accounts, selectedAccountIds, onSelect }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useLingui();

    const accountsCount = accounts.length;

    const accountIds = accounts.map(account => account.id);
    const isAllSelected = accountIds.every(accountId => selectedAccountIds.includes(accountId));
    const isPartiallySelected = accountIds.some(accountId => selectedAccountIds.includes(accountId)) && !isAllSelected;

    const handleSelectAll = () => void onSelect(...accountIds);
    const toggleOpen = () => void setIsOpen(prev => !prev);

    const handleSelectSingle = (id: number) => void onSelect(id);

    const arrowIcon = isOpen ? UserIconNameEnum.ChevronDown : UserIconNameEnum.ChevronRight;

    return (
        <View className={cardVariants({ isAllSelected, isPartiallySelected })}>
            <View className="flex-row items-center py-xl">
                <HapticPressable
                    onPress={toggleOpen}
                    className="p-xl"
                    testID={TransactionFiltersSelectors.AccountGroupToggle(type)}
                >
                    <Icon size={16} icon={arrowIcon} className="text-secondary-foreground" />
                </HapticPressable>

                <HapticPressable
                    onPress={handleSelectAll}
                    className="flex-row items-center gap-x-xl flex-1 px-3xl"
                    testID={TransactionFiltersSelectors.AccountGroupSelectAll(type)}
                >
                    <Icon size={16} icon={ACCOUNT_ICON[type]} className="text-secondary-foreground" />

                    <View className="gap-y-xxs mr-auto">
                        <Text className="text-sm text-secondary-foreground font-medium">{t(ACCOUNT_TYPE[type])}</Text>
                        <Text className="text-sm text-secondary-foreground">
                            <Trans>{accountsCount} accounts</Trans>
                        </Text>
                    </View>

                    {isAllSelected ? <Icon icon={UserIconNameEnum.Check} size={16} className="text-primary" /> : null}
                    {isPartiallySelected ? <Icon icon={UserIconNameEnum.Circle} size={16} className="text-primary" /> : null}
                </HapticPressable>
            </View>

            {isOpen ? (
                <View>
                    {accounts.map(account => (
                        <AccountFilterCard
                            onSelect={handleSelectSingle}
                            key={account.id}
                            account={account}
                            selectedAccountIds={selectedAccountIds}
                        />
                    ))}
                </View>
            ) : null}
        </View>
    );
};
