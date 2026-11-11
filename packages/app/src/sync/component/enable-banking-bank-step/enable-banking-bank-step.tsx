import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Arr from 'effect/Array';
import * as Order from 'effect/Order';
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
import { getDeviceRegionCode } from '../../utils/get-device-region-code.util';
import { isBankNamed } from '../../utils/is-bank-named.util';
import { EnableBankingBankRow } from '../enable-banking-bank-row/enable-banking-bank-row';

import type { EnableBankingBankInterface } from '@budgie/sync';

interface Props {
    readonly banks: readonly EnableBankingBankInterface[];
    readonly isLoading: boolean;
    readonly preselectedBankName: string | null;
    readonly onSelectBank: (bank: EnableBankingBankInterface) => void;
    readonly onGoBack: () => void;
}

const COMBINING_MARKS = /[̀-ͯ]/gu;

const foldSearchText = (text: string): string => text.normalize('NFD').replaceAll(COMBINING_MARKS, '').toLowerCase();

export const EnableBankingBankStep = ({ banks, isLoading, preselectedBankName, onSelectBank, onGoBack }: Props) => {
    const { t } = useLingui();
    const [query, setQuery] = useState('');
    const deferredQuery = useDeferredValue(query);

    const normalizedQuery = foldSearchText(deferredQuery.trim());
    const regionCode = getDeviceRegionCode();
    const matchingBanks = Arr.sort(
        banks.filter(bank => !isDefined(preselectedBankName) || isBankNamed(bank, preselectedBankName)),
        Order.mapInput(Order.String, (bank: EnableBankingBankInterface) => bank.name.toLocaleLowerCase())
    )
        .map((bank, index) => ({ ...bank, id: index }))
        .filter(bank => bank.isSupported && foldSearchText(`${bank.name} ${bank.country}`).includes(normalizedQuery));
    const localBanks = matchingBanks.filter(bank => bank.country === regionCode);
    const otherBanks = matchingBanks.filter(bank => bank.country !== regionCode);
    const hasBothGroups = isNotEmptyArray(localBanks) && isNotEmptyArray(otherBanks);
    const listData = hasBothGroups ? otherBanks : matchingBanks;

    const emptyTitle = isDefined(preselectedBankName) ? t`${preselectedBankName} is not available` : t`No banks found`;
    const emptyDescription = isDefined(preselectedBankName)
        ? t`Enable Banking cannot connect ${preselectedBankName} in any country right now.`
        : t`Try another name.`;

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
                    emptyState={
                        <LoadingContent isLoading={isLoading}>
                            <SearchablePageEmptyState icon={UserIconNameEnum.Search} title={emptyTitle} description={emptyDescription} />
                        </LoadingContent>
                    }
                    listHeader={listHeader}
                    renderCard={renderCard}
                    sizing={GROUPED_LIST_SIZING}
                />
            </SearchablePage>
        </GroupedSurface>
    );
};
