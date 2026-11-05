import { useLingui } from '@lingui/react/macro';

import { GroupedListSwitchRow } from '../../../@generic/component/grouped-list-switch-row/grouped-list-switch-row';
import { getAccountIdentityLabel } from '../../utils/get-account-identity-label.util';

import { SyncAccountRowSelector } from './sync-account-row.selector';

import type { SyncAccountPreviewInterface } from '@budgie/sync';
import type { ReactNode } from 'react';

interface Props {
    readonly preview: Pick<SyncAccountPreviewInterface, 'externalId' | 'title' | 'currencyCode' | 'iban' | 'hasSync'>;
    readonly logo: ReactNode;
    readonly isSelected: boolean;
    readonly onToggle: (externalId: string) => void;
}

export const SyncAccountRow = ({ preview, logo, isSelected, onToggle }: Props) => {
    const { t } = useLingui();

    const subtitle = preview.hasSync ? t`Already syncing` : getAccountIdentityLabel(preview.currencyCode, preview.iban);
    const handleChange = () => {
        onToggle(preview.externalId);
    };

    return (
        <GroupedListSwitchRow
            left={logo}
            title={preview.title}
            subtitle={subtitle}
            value={isSelected}
            testID={SyncAccountRowSelector.Row(preview.title)}
            switchTestID={SyncAccountRowSelector.Toggle(preview.title)}
            onChange={handleChange}
        />
    );
};
