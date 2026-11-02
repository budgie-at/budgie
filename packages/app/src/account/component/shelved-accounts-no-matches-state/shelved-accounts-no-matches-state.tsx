import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { EmptyFn } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { SearchablePageEmptyState } from '../../../@generic/component/searchable-page-empty-state/searchable-page-empty-state';

interface Props {
    readonly title: string;
    readonly onClearSearch: EmptyFn;
}

export const ShelvedAccountsNoMatchesState = ({ title, onClearSearch }: Props) => {
    const { t } = useLingui();

    return (
        <SearchablePageEmptyState
            icon={UserIconNameEnum.Search}
            title={title}
            description={t`Check the spelling or search by another name.`}
        >
            <Button variant="ghost" size="sm" content={t`Clear search`} onPress={onClearSearch} className="border-0 bg-transparent" />
        </SearchablePageEmptyState>
    );
};
