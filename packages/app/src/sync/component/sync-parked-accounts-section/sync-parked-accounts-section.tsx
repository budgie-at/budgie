import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isEmptyArray } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { getAccountIdentityLabel } from '../../utils/get-account-identity-label.util';

import type { SyncAccountPreviewInterface } from '@budgie/sync';

interface Props {
    readonly previews: ReadonlyArray<Pick<SyncAccountPreviewInterface, 'externalId' | 'title' | 'currencyCode' | 'iban'>>;
    readonly footer: string;
}

export const SyncParkedAccountsSection = ({ previews, footer }: Props) => {
    const { t } = useLingui();

    if (isEmptyArray(previews)) {
        return null;
    }

    return (
        <GroupedListSection title={t`Cannot connect`} footer={footer}>
            {previews.map(preview => (
                <GroupedListRow
                    key={preview.externalId}
                    left={<GroupedListIcon icon={UserIconNameEnum.Unlink} />}
                    title={<Text className="text-secondary-foreground text-[17px]">{preview.title}</Text>}
                    subtitle={getAccountIdentityLabel(preview.currencyCode, preview.iban)}
                />
            ))}
        </GroupedListSection>
    );
};
