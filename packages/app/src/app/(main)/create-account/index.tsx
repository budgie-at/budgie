import { AccountTypeEnum, ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useDeferredValue, useState } from 'react';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { SearchListBottomSpacer } from '../../../@generic/component/search-list-bottom-spacer/search-list-bottom-spacer';
import { SearchablePageSearchInput } from '../../../@generic/component/searchable-page-search-input/searchable-page-search-input';
import { StackedLargeTitle } from '../../../@generic/component/stacked-large-title/stacked-large-title';
import { StackedSmallTitle } from '../../../@generic/component/stacked-small-title/stacked-small-title';
import { READABLE_CONTENT_CLASSNAME } from '../../../@generic/constant/readable-content-classname.constant';
import { STACKED_TITLE_CHROME_CONFIG } from '../../../@generic/constant/stacked-title-chrome-config.constant';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { CollapsibleChromeSearchProvider } from '../../../@generic/provider/collapsible-chrome-search.provider';
import { cn } from '../../../@generic/utils/cn.util';
import { foldSearchText } from '../../../@generic/utils/fold-search-text.util';
import { CreateAccountManualRows } from '../../../account/component/create-account-manual-rows/create-account-manual-rows';
import { CreateAccountManualTiles } from '../../../account/component/create-account-manual-tiles/create-account-manual-tiles';
import { CreateBankSearchResults } from '../../../account/component/create-bank-search-results/create-bank-search-results';
import { CreateMoreBanksCard } from '../../../account/component/create-more-banks-card/create-more-banks-card';
import { CreateSyncCard } from '../../../account/component/create-sync-card/create-sync-card';
import { ACCOUNT_ICON } from '../../../account/constant/account-icon.constant';
import { ACCOUNT_KIND_TITLE } from '../../../account/constant/account-kind-title.constant';

import type { CreateAccountManualOptionInterface } from '../../../account/interface/create-account-manual-option.interface';
import type { MessageDescriptor } from '@lingui/core';

const GROUPED_STACKED_TITLE_CHROME_CONFIG = {
    ...STACKED_TITLE_CHROME_CONFIG,
    smallTitleStart: 18,
    largeTitleEnd: 27,
    collapseEnd: 36,
    topFadeHeight: 60,
    headerBackdropHeight: 60,
    colors: {
        light: { solid: 'rgb(242,242,247)', wash: 'rgb(242,242,247)' },
        dark: { solid: 'rgb(0,0,0)', wash: 'rgb(0,0,0)' }
    },
    maskStops: {
        top: {
            0: { color: '#000000' },
            0.25: { color: '#000000' },
            0.5: { color: '#000000' },
            0.75: { color: '#000000' },
            0.86: { color: '#000000' },
            1: { color: 'transparent' }
        },
        bottom: {}
    }
};

const SEARCH_FOOTERS = { sync: null, import: null, manual: null };

const SYNC_OPTIONS = [
    { provider: ExternalSourceEnum.MONOBANK, title: msg`Monobank`, description: msg`Connect with a token from the app` },
    { provider: ExternalSourceEnum.WISE, title: msg`Wise`, description: msg`Sign in on Wise's own page` },
    { provider: ExternalSourceEnum.BINANCE, title: msg`Binance`, description: msg`Connect with a read‑only key` }
];

const IMPORT_OPTIONS = [
    { provider: ExternalSourceEnum.PRIVATBANK, title: msg`Privatbank`, description: msg`Excel statement from Privat24` },
    { provider: ExternalSourceEnum.ERSTE, title: msg`Erste Bank`, description: msg`PDF statement from George` },
    { provider: ExternalSourceEnum.INZHUR, title: msg`Inzhur`, description: msg`Excel statement from Inzhur` }
];

const MANUAL_OPTIONS: readonly CreateAccountManualOptionInterface[] = [
    {
        type: AccountTypeEnum.BANK,
        icon: ACCOUNT_ICON[AccountTypeEnum.BANK],
        title: ACCOUNT_KIND_TITLE[AccountTypeEnum.BANK],
        description: msg`Cards and daily spending`
    },
    {
        type: AccountTypeEnum.CASH,
        icon: ACCOUNT_ICON[AccountTypeEnum.CASH],
        title: ACCOUNT_KIND_TITLE[AccountTypeEnum.CASH],
        description: msg`Wallet cash, savings and pots`
    },
    {
        type: AccountTypeEnum.CRYPTO,
        icon: ACCOUNT_ICON[AccountTypeEnum.CRYPTO],
        title: ACCOUNT_KIND_TITLE[AccountTypeEnum.CRYPTO],
        description: msg`Wallets you track yourself`
    },
    {
        type: AccountTypeEnum.STOCKS,
        icon: ACCOUNT_ICON[AccountTypeEnum.STOCKS],
        title: msg`Brokerage`,
        description: msg`Stocks and ETFs at a broker`
    },
    {
        type: AccountTypeEnum.DEBT,
        icon: ACCOUNT_ICON[AccountTypeEnum.DEBT],
        title: ACCOUNT_KIND_TITLE[AccountTypeEnum.DEBT],
        description: msg`Money you lent or borrowed`
    },
    {
        type: AccountTypeEnum.DEPOSIT,
        icon: UserIconNameEnum.Vault,
        title: ACCOUNT_KIND_TITLE[AccountTypeEnum.DEPOSIT],
        description: msg`Fixed term with interest`
    }
];

export default function Index() {
    const { t } = useLingui();
    const [query, setQuery] = useState('');
    const isAccessibilityTextSize = useIsAccessibilityTextSize();

    const normalizedQuery = foldSearchText(useDeferredValue(query).trim());
    const isSearching = isNotEmptyString(normalizedQuery);
    const isMatch = ({ title, description }: { readonly title: MessageDescriptor; readonly description: MessageDescriptor }) =>
        foldSearchText(`${t(title)} ${t(description)}`).includes(normalizedQuery);
    const syncOptions = SYNC_OPTIONS.filter(isMatch);
    const importOptions = IMPORT_OPTIONS.filter(isMatch);
    const manualOptions = MANUAL_OPTIONS.filter(isMatch);
    const footers = isSearching
        ? SEARCH_FOOTERS
        : {
              sync: t`Read-only. Tokens and keys stay on this device.`,
              import: t`Files are read on this device and never uploaded.`,
              manual: t`Enter balances yourself. No connection needed.`
          };

    const syncSection = isNotEmptyArray(syncOptions) ? (
        <GroupedListSection title={t`Sync automatically`} footer={footers.sync}>
            {syncOptions.map(option => (
                <CreateSyncCard
                    key={option.provider}
                    title={t(option.title)}
                    description={t(option.description)}
                    bankProvider={option.provider}
                />
            ))}
            {isSearching ? null : <CreateMoreBanksCard title={t`2,000+ European banks`} subtitle={t`Sign in on your bank's own page`} />}
        </GroupedListSection>
    ) : null;
    const importSection = isNotEmptyArray(importOptions) ? (
        <GroupedListSection title={t`Import statements`} footer={footers.import}>
            {importOptions.map(option => (
                <CreateSyncCard
                    key={option.provider}
                    title={t(option.title)}
                    description={t(option.description)}
                    bankProvider={option.provider}
                />
            ))}
        </GroupedListSection>
    ) : null;
    const manualTypes =
        isSearching || isAccessibilityTextSize ? (
            <CreateAccountManualRows options={manualOptions} />
        ) : (
            <CreateAccountManualTiles options={manualOptions} />
        );
    const manualSection = isNotEmptyArray(manualOptions) ? (
        <GroupedListSection title={t`Add manually`} footer={footers.manual}>
            {manualTypes}
        </GroupedListSection>
    ) : null;

    return (
        <GroupedSurface>
            <CollapsibleChromeSearchProvider>
                <CollapsibleChromePage
                    largeTitle={<StackedLargeTitle title={t`New Account`} />}
                    smallTitle={<StackedSmallTitle title={t`New Account`} />}
                    leading={<HeaderBackButton />}
                    contentClassName={cn('gap-y-[20px] pt-[20px]', READABLE_CONTENT_CLASSNAME)}
                    chromeConfig={GROUPED_STACKED_TITLE_CHROME_CONFIG}
                >
                    {isSearching ? (
                        <CreateBankSearchResults query={normalizedQuery}>
                            {syncSection}
                            {importSection}
                            {manualSection}
                        </CreateBankSearchResults>
                    ) : (
                        <>
                            {syncSection}
                            {importSection}
                            {manualSection}
                        </>
                    )}

                    <SearchListBottomSpacer />
                </CollapsibleChromePage>

                <SearchablePageSearchInput search={query} placeholder={t`Search banks and accounts`} onSearchChange={setQuery} />
            </CollapsibleChromeSearchProvider>
        </GroupedSurface>
    );
}
