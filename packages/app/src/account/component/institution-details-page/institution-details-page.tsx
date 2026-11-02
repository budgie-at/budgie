import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { CollapsibleChromeHeader } from '../../../@generic/component/collapsible-chrome-header/collapsible-chrome-header';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { RevealGate } from '../../../@generic/component/reveal-gate/reveal-gate';
import { SCREEN_CHROME_CONFIG } from '../../../@generic/constant/screen-chrome-config.constant';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';
import { InstitutionSelector } from '../../../app/(main)/institution/institution.selector';
import { decimalPlacesAtom, defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { BankIntegrationContext } from '../../../sync/context/bank-integration.context';
import { getBankIntegrationCapabilities } from '../../../sync/utils/get-bank-integration-capabilities.util';
import { CollapsibleChromeTransactionList } from '../../../transaction/components/collapsible-chrome-transaction-list/collapsible-chrome-transaction-list';
import { BANK_PROVIDER_TITLE } from '../../constant/bank-provider-title.constant';
import { useIsStaticAccountDetailsHeader } from '../../hook/use-is-static-account-details-header.hook';
import { getBankIntegrationTitle } from '../../utils/get-bank-integration-title.util';
import { AccountDetailsHeaderBackdrop } from '../account-details-header-backdrop/account-details-header-backdrop';
import { AccountDetailsHeroBalance } from '../account-details-hero-balance/account-details-hero-balance';
import { AccountDetailsStaticTitle } from '../account-details-static-title/account-details-static-title';
import { AccountDetailsTitle } from '../account-details-title/account-details-title';
import { InstitutionDetailsSummary } from '../institution-details-summary/institution-details-summary';
import { InstitutionSettingsButton } from '../institution-settings-button/institution-settings-button';

import type { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import type { InstitutionGroupInterface } from '../../interface/institution-group.interface';
import type { BankIntegrationEntityInterface } from '@budgie/contracts';

interface Props {
    readonly integration: BankIntegrationEntityInterface;
    readonly institution: InstitutionGroupInterface;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
}

const INSTITUTION_SCREEN_CHROME_CONFIG = {
    ...SCREEN_CHROME_CONFIG,
    smallTitleStart: 0,
    largeTitleEnd: 24,
    collapseEnd: 24
};

export const InstitutionDetailsPage = ({ integration, institution, balancesByAccountId }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const displayTotal = Number(institution.total.toFixed(decimalPlaces)) === 0 ? 0 : institution.total;
    const isStaticHeader = useIsStaticAccountDetailsHeader();
    const titleDescriptor = BANK_PROVIDER_TITLE[institution.provider];
    const title = getBankIntegrationTitle(
        isDefined(titleDescriptor) ? t(titleDescriptor) : institution.provider,
        institution.label,
        institution.groupNumber
    );
    const contextValue = { integration, capabilities: getBankIntegrationCapabilities(integration) };
    const headerTitle = isStaticHeader ? (
        <AccountDetailsStaticTitle title={title} balance={displayTotal} instrumentSymbol={defaultInstrument.symbol} />
    ) : (
        <AccountDetailsTitle title={title} />
    );

    const transactionList = (
        <View className="flex-1">
            <CollapsibleChromeTransactionList accountIds={institution.accounts.map(account => account.id)}>
                <InstitutionDetailsSummary institution={institution} balancesByAccountId={balancesByAccountId} />
            </CollapsibleChromeTransactionList>
        </View>
    );

    return (
        <GroupedSurface testID={InstitutionSelector.Page}>
            <RevealGate isLoading={false}>
                <BankIntegrationContext.Provider value={contextValue}>
                    <ScreenChromeThemeProvider config={INSTITUTION_SCREEN_CHROME_CONFIG}>
                        <ScreenChromeFrame>
                            {transactionList}
                            <AccountDetailsHeaderBackdrop />
                            <CollapsibleChromeHeader
                                leading={<HeaderBackButton />}
                                trailing={<InstitutionSettingsButton integrationId={integration.id} />}
                                expandedTitle={null}
                                collapsedTitle={null}
                            />
                            {headerTitle}
                            <AccountDetailsHeroBalance balance={displayTotal} instrumentSymbol={defaultInstrument.symbol} />
                        </ScreenChromeFrame>
                    </ScreenChromeThemeProvider>
                </BankIntegrationContext.Provider>
            </RevealGate>
        </GroupedSurface>
    );
};
