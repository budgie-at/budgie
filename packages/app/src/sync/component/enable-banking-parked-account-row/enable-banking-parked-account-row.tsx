import { UserIconNameEnum } from '@budgie/contracts';
import { Text } from 'react-native';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { getAccountIdentityLabel } from '../../utils/get-account-identity-label.util';

import type { SyncAccountPreviewInterface } from '@budgie/sync';

interface Props {
    readonly preview: Pick<SyncAccountPreviewInterface, 'title' | 'currencyCode' | 'iban'>;
}

export const EnableBankingParkedAccountRow = ({ preview }: Props) => (
    <GroupedListRow
        left={<GroupedListIcon icon={UserIconNameEnum.Unlink} />}
        title={<Text className="text-secondary-foreground text-[17px]">{preview.title}</Text>}
        subtitle={getAccountIdentityLabel(preview.currencyCode, preview.iban)}
    />
);
