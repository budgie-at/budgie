import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { EmptyFn } from '@rnw-community/shared';

import { Button } from '../button/button';
import { SearchablePageEmptyState } from '../searchable-page-empty-state/searchable-page-empty-state';

interface Props {
    readonly onRetry: EmptyFn;
}

export const SearchablePageErrorState = ({ onRetry }: Props) => {
    const { t } = useLingui();

    return (
        <SearchablePageEmptyState
            icon={UserIconNameEnum.TriangleAlert}
            title={t`Couldn’t load this list`}
            description={t`Your data is safe. Reading it failed this time.`}
        >
            <Button
                variant="cta"
                size="sm"
                leftIcon={UserIconNameEnum.RotateCw}
                content={t`Try again`}
                onPress={onRetry}
                className="rounded-full px-5xl"
            />
        </SearchablePageEmptyState>
    );
};
