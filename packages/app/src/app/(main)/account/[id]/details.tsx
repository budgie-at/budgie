import { AccountDebtTypeEnum, AccountTypeEnum } from '@budgie/contracts';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { CollapsibleHeaderBackdrop, ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { CollapsibleChromeHeader } from '../../../../@generic/component/collapsible-chrome-header/collapsible-chrome-header';
import { HeaderBackButton } from '../../../../@generic/component/header-back-button/header-back-button';
import { LoadingScreen } from '../../../../@generic/component/loading-screen/loading-screen';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { ScreenChromeThemeProvider } from '../../../../@generic/provider/screen-chrome-theme.provider';
import { AccountBalance } from '../../../../account/component/account-balance/account-balance';
import { AccountDetailsEditButton } from '../../../../account/component/account-details-edit-button/account-details-edit-button';
import { AccountDetailsLargeTitle } from '../../../../account/component/account-details-large-title/account-details-large-title';
import { AccountDetailsMenuControls } from '../../../../account/component/account-details-menu-controls/account-details-menu-controls';
import { AccountDetailsSmallTitle } from '../../../../account/component/account-details-small-title/account-details-small-title';
import { DebtAccountBalance } from '../../../../account/component/debt-account-balance/debt-account-balance';
import { DepositAccountActionsMenu } from '../../../../account/component/deposit-account-actions-menu/deposit-account-actions-menu';
import { DepositDetailsCard } from '../../../../account/component/deposit-details-card/deposit-details-card';
import { useAccountBalanceQuery } from '../../../../account/query/use-account-balance.query';
import { useDebtAccountProgressSummaryQuery } from '../../../../account/query/use-debt-account-progress-summary.query';
import { useGetAccountByIdQuery } from '../../../../account/query/use-get-account-by-id.query';
import { InstallmentPlanScheduleSummary } from '../../../../installment-plan/component/installment-plan-schedule-summary/installment-plan-schedule-summary';
import { CollapsibleChromeTransactionList } from '../../../../transaction/components/collapsible-chrome-transaction-list/collapsible-chrome-transaction-list';

import { AccountDetailsSelector } from './account-details.selector';

export default function AccountDetails() {
    const id = Number(useLocalSearchParams<IdParamInterface>().id);

    const { account, isLoading } = useGetAccountByIdQuery(id);
    const { balance } = useAccountBalanceQuery(id);
    const debtProgressSummary = useDebtAccountProgressSummaryQuery(id);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isDefined(account)) {
        return <Redirect href="/" />;
    }

    const instrumentSymbol = account.instrument.symbol;
    const headerTrailing =
        account.type === AccountTypeEnum.DEPOSIT ? (
            <DepositAccountActionsMenu accountId={id} balance={balance} instrumentSymbol={instrumentSymbol} />
        ) : (
            <AccountDetailsEditButton accountId={id} />
        );

    return (
        <View className="flex-1" testID={AccountDetailsSelector.Page} collapsable={false}>
            <ScreenChromeThemeProvider>
                <ScreenChromeFrame>
                    <View className="flex-1 px-5xl">
                        <CollapsibleChromeTransactionList accountId={id}>
                            {account.type === AccountTypeEnum.DEBT ? (
                                <DebtAccountBalance
                                    accountId={id}
                                    debtType={account.debtType}
                                    instrumentSymbol={instrumentSymbol}
                                    summary={debtProgressSummary}
                                />
                            ) : (
                                <AccountBalance instrumentSymbol={instrumentSymbol} balance={balance} />
                            )}

                            {account.debtType === AccountDebtTypeEnum.INSTALLMENT ? (
                                <InstallmentPlanScheduleSummary accountId={id} instrumentSymbol={instrumentSymbol} />
                            ) : null}

                            {account.type === AccountTypeEnum.DEPOSIT ? (
                                <DepositDetailsCard
                                    balance={balance}
                                    instrumentSymbol={instrumentSymbol}
                                    interestRate={account.interestRate}
                                    deadline={account.deadline}
                                />
                            ) : null}
                        </CollapsibleChromeTransactionList>
                    </View>

                    <CollapsibleHeaderBackdrop />

                    <CollapsibleChromeHeader
                        leading={<HeaderBackButton />}
                        trailing={headerTrailing}
                        expandedTitle={<AccountDetailsLargeTitle account={account} />}
                        collapsedTitle={
                            <AccountDetailsSmallTitle title={account.title} balance={balance} instrumentSymbol={instrumentSymbol} />
                        }
                    />
                </ScreenChromeFrame>
            </ScreenChromeThemeProvider>

            <AccountDetailsMenuControls accountId={id} accountType={account.type} />
        </View>
    );
}
