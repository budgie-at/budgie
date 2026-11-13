import { AccountDebtTypeEnum, AccountTypeEnum } from '@budgie/contracts';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { CollapsibleChromeHeader } from '../../../../@generic/component/collapsible-chrome-header/collapsible-chrome-header';
import { CollapsibleChromeScrollFade } from '../../../../@generic/component/collapsible-chrome-scroll-fade/collapsible-chrome-scroll-fade';
import { GroupedSurface } from '../../../../@generic/component/grouped-surface/grouped-surface';
import { HeaderBackButton } from '../../../../@generic/component/header-back-button/header-back-button';
import { RevealGate } from '../../../../@generic/component/reveal-gate/reveal-gate';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { ScreenChromeThemeProvider } from '../../../../@generic/provider/screen-chrome-theme.provider';
import { AccountActionsMenu } from '../../../../account/component/account-actions-menu/account-actions-menu';
import { AccountDetailsHeaderBackdrop } from '../../../../account/component/account-details-header-backdrop/account-details-header-backdrop';
import { AccountDetailsHero } from '../../../../account/component/account-details-hero/account-details-hero';
import { AccountDetailsMenuControls } from '../../../../account/component/account-details-menu-controls/account-details-menu-controls';
import { AccountDetailsNavBalance } from '../../../../account/component/account-details-nav-balance/account-details-nav-balance';
import { AccountDetailsStaticTitle } from '../../../../account/component/account-details-static-title/account-details-static-title';
import { AccountDetailsTitle } from '../../../../account/component/account-details-title/account-details-title';
import { AccountValueHeroBalance } from '../../../../account/component/account-value-hero-balance/account-value-hero-balance';
import { DebtAccountBalance } from '../../../../account/component/debt-account-balance/debt-account-balance';
import { DepositDetailsCard } from '../../../../account/component/deposit-details-card/deposit-details-card';
import { ACCOUNT_DETAILS_SCREEN_CHROME_CONFIG } from '../../../../account/constant/account-details-screen-chrome-config.constant';
import { useIsStaticAccountDetailsHeader } from '../../../../account/hook/use-is-static-account-details-header.hook';
import { useAccountBalanceQuery } from '../../../../account/query/use-account-balance.query';
import { useDebtAccountProgressSummaryQuery } from '../../../../account/query/use-debt-account-progress-summary.query';
import { useGetAccountByIdQuery } from '../../../../account/query/use-get-account-by-id.query';
import { getAccountDisplayTitle } from '../../../../account/utils/get-account-display-title.util';
import { isUntrackedOwnAccount } from '../../../../account/utils/is-untracked-own-account.util';
import { InstallmentPlanScheduleSummary } from '../../../../installment-plan/component/installment-plan-schedule-summary/installment-plan-schedule-summary';
import { CollapsibleChromeTransactionList } from '../../../../transaction/components/collapsible-chrome-transaction-list/collapsible-chrome-transaction-list';

import { AccountDetailsSelector } from './account-details.selector';

export default function AccountDetails() {
    const id = Number(useLocalSearchParams<IdParamInterface>().id);

    const { account, isLoading } = useGetAccountByIdQuery(id);
    const { balance } = useAccountBalanceQuery(id);
    const debtProgressSummary = useDebtAccountProgressSummaryQuery(id);
    const isStaticHeader = useIsStaticAccountDetailsHeader();

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
    const headerTrailing = isUntrackedOwnAccount(account) ? null : <AccountActionsMenu account={account} />;

    const accountSummary =
        account.type === AccountTypeEnum.DEBT ? (
            <CollapsibleChromeScrollFade>
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
            </CollapsibleChromeScrollFade>
        ) : (
            <View className="gap-y-4xl">
                <AccountDetailsHero account={account} balance={balance} />

                {account.type === AccountTypeEnum.DEPOSIT ? (
                    <CollapsibleChromeScrollFade>
                        <DepositDetailsCard
                            balance={balance}
                            instrumentSymbol={instrumentSymbol}
                            interestRate={account.interestRate}
                            deadline={account.deadline}
                        />
                    </CollapsibleChromeScrollFade>
                ) : null}
            </View>
        );

    const isDebt = account.type === AccountTypeEnum.DEBT;
    const animatedTitle = (
        <>
            <AccountDetailsTitle title={getAccountDisplayTitle(account)} />

            {isDebt ? <AccountDetailsNavBalance balance={balance} instrumentSymbol={instrumentSymbol} /> : null}
        </>
    );
    const headerTitle = isStaticHeader ? (
        <AccountDetailsStaticTitle title={getAccountDisplayTitle(account)} balance={balance} account={account} />
    ) : (
        animatedTitle
    );

    return (
        <GroupedSurface testID={AccountDetailsSelector.Page}>
            <RevealGate isLoading={false}>
                <ScreenChromeThemeProvider config={ACCOUNT_DETAILS_SCREEN_CHROME_CONFIG}>
                    <ScreenChromeFrame>
                        <View className="flex-1">
                            <CollapsibleChromeTransactionList accountIds={Array.of(id)}>{accountSummary}</CollapsibleChromeTransactionList>
                        </View>

                        <AccountDetailsHeaderBackdrop />

                        <CollapsibleChromeHeader
                            leading={<HeaderBackButton />}
                            trailing={headerTrailing}
                            expandedTitle={null}
                            collapsedTitle={null}
                        />

                        {headerTitle}

                        {isDebt ? null : <AccountValueHeroBalance balance={balance} account={account} />}
                    </ScreenChromeFrame>
                </ScreenChromeThemeProvider>
            </RevealGate>

            <AccountDetailsMenuControls account={account} />
        </GroupedSurface>
    );
}
