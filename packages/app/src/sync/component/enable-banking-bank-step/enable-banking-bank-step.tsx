import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Arr from 'effect/Array';
import * as Order from 'effect/Order';
import { getLocales } from 'expo-localization';
import { useDeferredValue, useState } from 'react';
import { View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { SearchablePageEmptyState } from '../../../@generic/component/searchable-page-empty-state/searchable-page-empty-state';
import { SearchablePageList } from '../../../@generic/component/searchable-page-list/searchable-page-list';
import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { GROUPED_LIST_SIZING } from '../../../@generic/constant/grouped-list-sizing.constant';
import { EnableBankingBankListItem } from '../enable-banking-bank-list-item/enable-banking-bank-list-item';
import { EnableBankingBankRow } from '../enable-banking-bank-row/enable-banking-bank-row';

import type { EnableBankingBankInterface } from '@budgie/sync';

interface Props {
    readonly banks: readonly EnableBankingBankInterface[];
    readonly onSelectBank: (bank: EnableBankingBankInterface) => void;
    readonly onGoBack: () => void;
}

const COMBINING_MARKS = /[̀-ͯ]/gu;

const foldSearchText = (text: string): string => text.normalize('NFD').replaceAll(COMBINING_MARKS, '').toLowerCase();

export const EnableBankingBankStep = ({ banks, onSelectBank, onGoBack }: Props) => {
    const { t } = useLingui();
    const [query, setQuery] = useState('');
    const deferredQuery = useDeferredValue(query);

    const normalizedQuery = foldSearchText(deferredQuery.trim());
    const regionCode = getLocales().at(0)?.regionCode?.toUpperCase();
    const matchingBanks = Arr.sort(
        banks,
        Order.mapInput(Order.String, (bank: EnableBankingBankInterface) => bank.name.toLocaleLowerCase())
    )
        .map((bank, index) => ({ ...bank, id: index }))
        .filter(bank => bank.isSupported && foldSearchText(`${bank.name} ${bank.country}`).includes(normalizedQuery));
    const localBanks = matchingBanks.filter(bank => bank.country === regionCode);
    const otherBanks = matchingBanks.filter(bank => bank.country !== regionCode);
    const hasBothGroups = isNotEmptyArray(localBanks) && isNotEmptyArray(otherBanks);
    const listData = hasBothGroups ? otherBanks : matchingBanks;

    const renderCard = (bank: EnableBankingBankInterface, index: number, isLast: boolean) => (
        <EnableBankingBankListItem bank={bank} isFirst={index === 0} isLast={isLast} onSelect={onSelectBank} />
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
                        <SearchablePageEmptyState
                            icon={UserIconNameEnum.Search}
                            title={t`No banks found`}
                            description={t`Try another name.`}
                        />
                    }
                    listHeader={listHeader}
                    renderCard={renderCard}
                    sizing={GROUPED_LIST_SIZING}
                />
            </SearchablePage>
        </GroupedSurface>
    );
};
