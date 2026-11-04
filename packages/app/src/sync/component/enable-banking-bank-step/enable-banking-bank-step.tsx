import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { Input } from '../../../@generic/component/input/input';
import { EnableBankingBankRow } from '../enable-banking-bank-row/enable-banking-bank-row';

import type { EnableBankingBankInterface } from '@budgie/sync';

interface Props {
    readonly banks: readonly EnableBankingBankInterface[];
    readonly onSelectBank: (bank: EnableBankingBankInterface) => void;
}

const MAX_VISIBLE_BANKS = 30;

export const EnableBankingBankStep = ({ banks, onSelectBank }: Props) => {
    const { t } = useLingui();
    const [query, setQuery] = useState('');

    const normalizedQuery = query.trim().toLowerCase();
    const visibleBanks = banks
        .filter(bank => bank.isSupported && `${bank.name} ${bank.country}`.toLowerCase().includes(normalizedQuery))
        .slice(0, MAX_VISIBLE_BANKS);

    return (
        <>
            <Input value={query} onChangeText={setQuery} placeholder={t`Search your bank`} autoCapitalize="none" autoCorrect={false} />

            <GroupedListSection title={t`Banks`}>
                {visibleBanks.map(bank => (
                    <EnableBankingBankRow key={`${bank.country}.${bank.name}`} bank={bank} onSelect={onSelectBank} />
                ))}
            </GroupedListSection>
        </>
    );
};
