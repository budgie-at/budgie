import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ENTRANCE_MAX_STEP, ENTRANCE_STAGGER } from '../../../@generic/constant/entrance-motion.constant';
import { EASE_OUT, MOTION_BASE_DURATION, MOTION_LAYOUT } from '../../../@generic/constant/motion.constant';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { InstitutionSelector } from '../../../app/(main)/institution/institution.selector';
import { SettingsGroup } from '../../../settings/components/settings-group/settings-group';
import { SettingsRowAccessory } from '../../../settings/components/settings-row-accessory/settings-row-accessory';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import { getTransactionListRowPosition } from '../../../transaction/utils/get-transaction-list-row-position.util';
import { InstitutionAccountRow } from '../institution-account-row/institution-account-row';

import type { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import type { InstitutionGroupInterface } from '../../interface/institution-group.interface';

const INITIAL_VISIBLE_ACCOUNTS = 3;

interface Props {
    readonly institution: InstitutionGroupInterface;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
}

export const InstitutionAccounts = ({ institution, balancesByAccountId }: Props) => {
    const { t } = useLingui();
    const [showAll, setShowAll] = useState(false);
    const reducedMotion = useReducedMotion();
    const accountsCount = institution.accounts.length;
    const visibleAccounts = showAll ? institution.accounts : institution.accounts.slice(0, INITIAL_VISIBLE_ACCOUNTS);
    const hasMore = visibleAccounts.length < accountsCount;
    const rowCount = visibleAccounts.length + Number(hasMore);
    const title = institution.accounts.every(account => account.type === AccountTypeEnum.CRYPTO_SYNC)
        ? t`Assets · ${accountsCount}`
        : t`Accounts · ${accountsCount}`;
    const layoutProps = reducedMotion ? {} : { layout: MOTION_LAYOUT };
    const handleShowAll = () => void setShowAll(true);

    return (
        <Animated.View {...layoutProps} testID={InstitutionSelector.Accounts}>
            <SettingsGroup title={title}>
                <View>
                    {visibleAccounts.map((account, index) => {
                        const isRevealed = showAll && !reducedMotion && index >= INITIAL_VISIBLE_ACCOUNTS;
                        const revealStep = Math.min(index - INITIAL_VISIBLE_ACCOUNTS, ENTRANCE_MAX_STEP);
                        const enteringProps = isRevealed && {
                            entering: FadeIn.duration(MOTION_BASE_DURATION)
                                .easing(EASE_OUT)
                                .delay(revealStep * ENTRANCE_STAGGER)
                        };

                        return (
                            <Animated.View key={account.id} {...enteringProps}>
                                <InstitutionAccountRow
                                    account={account}
                                    provider={institution.provider}
                                    bankName={institution.label}
                                    balancesByAccountId={balancesByAccountId}
                                    position={getTransactionListRowPosition(index, rowCount)}
                                />
                            </Animated.View>
                        );
                    })}
                    {hasMore ? (
                        <TransactionRowSurface separatorInset={64} position={TransactionListRowPositionEnum.LAST}>
                            <SettingsRow
                                title={t`Show all ${accountsCount} accounts`}
                                icon={UserIconNameEnum.List}
                                variant="ghost"
                                onPress={handleShowAll}
                                right={<SettingsRowAccessory />}
                                testID={InstitutionSelector.ShowAllAccounts}
                            />
                        </TransactionRowSurface>
                    ) : null}
                </View>
            </SettingsGroup>
        </Animated.View>
    );
};
