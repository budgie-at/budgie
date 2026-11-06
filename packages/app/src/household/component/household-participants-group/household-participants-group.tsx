import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';

import type { ReactNode } from 'react';

interface Props {
    readonly isLoading: boolean;
    readonly isEmpty: boolean;
    readonly children: ReactNode;
}

export const HouseholdParticipantsGroup = ({ isLoading, isEmpty, children }: Props) => {
    const { t } = useLingui();

    return (
        <LoadingContent isLoading={isLoading}>
            {children}
            {isLoading && isEmpty ? (
                <SettingsRow icon={UserIconNameEnum.UserRound} variant="ghost" title={t`Family member`} subtitle={t`Member`} />
            ) : null}
        </LoadingContent>
    );
};
