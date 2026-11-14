import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useDeferredValue, useState } from 'react';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { GroupedListItem } from '../../../@generic/component/grouped-list-item/grouped-list-item';
import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { SearchablePageEmptyState } from '../../../@generic/component/searchable-page-empty-state/searchable-page-empty-state';
import { SearchablePageList } from '../../../@generic/component/searchable-page-list/searchable-page-list';
import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { GROUPED_LIST_SIZING } from '../../../@generic/constant/grouped-list-sizing.constant';
import { foldSearchText } from '../../../@generic/utils/fold-search-text.util';
import { getDeviceRegionCode } from '../../utils/get-device-region-code.util';
import { getEnableBankingBankSearchText } from '../../utils/get-enable-banking-bank-search-text.util';
import { sortEnableBankingBanks } from '../../utils/sort-enable-banking-banks.util';
import { EnableBankingBankRow } from '../enable-banking-bank-row/enable-banking-bank-row';

import type { EnableBankingBankInterface } from '@budgie/sync';
import type { ReactElement } from 'react';

interface Props {
    readonly banks: readonly EnableBankingBankInterface[];
    readonly isLoading: boolean;
    readonly preselectedBankName: string | null;
    readonly onSelectBank: (bank: EnableBankingBankInterface) => void;
    readonly onGoBack: () => void;
    readonly errorState?: ReactElement | null;
    readonly children?: ReactElement;
}

export const EnableBankingBankStep = ({ banks, isLoading, preselectedBankName, onSelectBank, onGoBack, errorState, children }: Props) => {
    const { t } = useLingui();
    const [query, setQuery] = useState('');

    const normalizedQuery = foldSearchText(useDeferredValue(query).trim());
    const regionCode = getDeviceRegionCode();
    const matchingBanks = sortEnableBankingBanks(banks)
        .map((bank, index) => ({ ...bank, id: index }))
        .filter(bank => bank.isSupported && getEnableBankingBankSearchText(bank, t).includes(normalizedQuery));
    const localBanks = matchingBanks.filter(bank => bank.country === regionCode);
    const otherBanks = matchingBanks.filter(bank => bank.country !== regionCode);
    const hasBothGroups = isNotEmptyArray(localBanks) && isNotEmptyArray(otherBanks);
    const listData = hasBothGroups ? otherBanks : matchingBanks;

    const isPreselectedBankMissing = isDefined(preselectedBankName) && !banks.some(bank => bank.isSupported);
    const { title: emptyTitle, description: emptyDescription } = isPreselectedBankMissing
        ? {
              title: t`${preselectedBankName} is not available`,
              description: t`Enable Banking cannot connect ${preselectedBankName} in any country right now.`
          }
        : { title: t`No banks found`, description: t`Try another name.` };

    const emptyState = errorState ?? (
        <LoadingContent isLoading={isLoading}>
            <SearchablePageEmptyState icon={UserIconNameEnum.Search} title={emptyTitle} description={emptyDescription}>
                {children}
            </SearchablePageEmptyState>
        </LoadingContent>
    );

    const renderCard = (bank: EnableBankingBankInterface, index: number, isLast: boolean) => (
        <GroupedListItem isFirst={index === 0} isLast={isLast}>
            <EnableBankingBankRow bank={bank} onSelect={onSelectBank} />
        </GroupedListItem>
    );

    const listHeader = hasBothGroups ? (
        <>
            <GroupedListSection title={t`In your country`}>
                {localBanks.map(bank => (
                    <EnableBankingBankRow key={bank.id} bank={bank} onSelect={onSelectBank} />
                ))}
            </GroupedListSection>
            <View className="pt-3xl">
                <GroupedListSectionTitle title={t`Other banks`} />
            </View>
        </>
    ) : null;

    return (
        <GroupedSurface>
            <SearchablePage
                title={t`Choose your bank`}
                onGoBack={onGoBack}
                search={query}
                searchPlaceholder={t`Search your bank`}
                onSearchChange={setQuery}
            >
                <SearchablePageList
                    data={listData}
                    emptyState={emptyState}
                    listHeader={listHeader}
                    listFooter={children}
                    renderCard={renderCard}
                    sizing={GROUPED_LIST_SIZING}
                />
            </SearchablePage>
        </GroupedSurface>
    );
};
