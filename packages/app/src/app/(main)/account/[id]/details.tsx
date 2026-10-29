import { AccountDebtTypeEnum, AccountTypeEnum } from '@budgie/contracts';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { CollapsibleChromeHeader } from '../../../../@generic/component/collapsible-chrome-header/collapsible-chrome-header';
import { GroupedSurface } from '../../../../@generic/component/grouped-surface/grouped-surface';
import { HeaderBackButton } from '../../../../@generic/component/header-back-button/header-back-button';
import { RevealGate } from '../../../../@generic/component/reveal-gate/reveal-gate';
import { SCREEN_CHROME_CONFIG } from '../../../../@generic/constant/screen-chrome-config.constant';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { ScreenChromeThemeProvider } from '../../../../@generic/provider/screen-chrome-theme.provider';
import { AccountActionsMenu } from '../../../../account/component/account-actions-menu/account-actions-menu';
import { AccountDetailsHeaderBackdrop } from '../../../../account/component/account-details-header-backdrop/account-details-header-backdrop';
import { AccountDetailsHero } from '../../../../account/component/account-details-hero/account-details-hero';
import { AccountDetailsLargeTitle } from '../../../../account/component/account-details-large-title/account-details-large-title';
import { AccountDetailsMenuControls } from '../../../../account/component/account-details-menu-controls/account-details-menu-controls';
import { AccountDetailsSmallTitle } from '../../../../account/component/account-details-small-title/account-details-small-title';
import { DebtAccountBalance } from '../../../../account/component/debt-account-balance/debt-account-balance';
import { DepositDetailsCard } from '../../../../account/component/deposit-details-card/deposit-details-card';
import { useAccountBalanceQuery } from '../../../../account/query/use-account-balance.query';
import { useDebtAccountProgressSummaryQuery } from '../../../../account/query/use-debt-account-progress-summary.query';
import { useGetAccountByIdQuery } from '../../../../account/query/use-get-account-by-id.query';
import { InstallmentPlanScheduleSummary } from '../../../../installment-plan/component/installment-plan-schedule-summary/installment-plan-schedule-summary';
import { CollapsibleChromeTransactionList } from '../../../../transaction/components/collapsible-chrome-transaction-list/collapsible-chrome-transaction-list';

import { AccountDetailsSelector } from './account-details.selector';

const TITLE_HANDOFF_DISTANCE = 24;
const ACCOUNT_DETAILS_SCREEN_CHROME_CONFIG = {
    ...SCREEN_CHROME_CONFIG,
    smallTitleStart: 0,
    largeTitleEnd: TITLE_HANDOFF_DISTANCE,
    collapseEnd: TITLE_HANDOFF_DISTANCE
};

export default function AccountDetails() {
    const id = Number(useLocalSearchParams<IdParamInterface>().id);

    const { account, isLoading } = useGetAccountByIdQuery(id);
    const { balance } = useAccountBalanceQuery(id);
    const debtProgressSummary = useDebtAccountProgressSummaryQuery(id);

    if (!isDefined(account)) {
        return isLoading ? (
            <GroupedSurface testID={AccountDetailsSelector.Page}>
                <RevealGate isLoading>{null}</RevealGate>
            </GroupedSurface>
        ) : (
            <Redirect href="/" />
        );
    }

    const instrumentSymbol = account.instrument.symbol;
    const headerTrailing = (
        <AccountActionsMenu accountId={id} accountType={account.type} balance={balance} instrumentSymbol={instrumentSymbol} />
    );

    const accountSummary =
        account.type === AccountTypeEnum.DEBT ? (
            <View className="gap-y-md">
                <DebtAccountBalance
                    accountId={id}
                    debtType={account.debtType}
                    instrumentSymbol={instrumentSymbol}
                    summary={debtProgressSummary}
                />

                {account.debtType === AccountDebtTypeEnum.INSTALLMENT ? (
                    <InstallmentPlanScheduleSummary accountId={id} instrumentSymbol={instrumentSymbol} />
                ) : null}
            </View>
        ) : (
            <View className="gap-y-4xl">
                <AccountDetailsHero account={account} balance={balance} />

                {account.type === AccountTypeEnum.DEPOSIT ? (
                    <DepositDetailsCard
                        balance={balance}
                        instrumentSymbol={instrumentSymbol}
                        interestRate={account.interestRate}
                        deadline={account.deadline}
                    />
                ) : null}
            </View>
        );

    return (
        <GroupedSurface testID={AccountDetailsSelector.Page}>
            <RevealGate isLoading={false}>
                <ScreenChromeThemeProvider config={ACCOUNT_DETAILS_SCREEN_CHROME_CONFIG}>
                    <ScreenChromeFrame>
                        <View className="flex-1">
                            <CollapsibleChromeTransactionList accountId={id}>{accountSummary}</CollapsibleChromeTransactionList>
                        </View>

                        <AccountDetailsHeaderBackdrop />

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
            </RevealGate>

            <AccountDetailsMenuControls accountId={id} accountType={account.type} />
        </GroupedSurface>
    );
}
