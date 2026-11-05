import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { CloudBackupRow } from '../cloud-backup-row/cloud-backup-row';

import type { CloudBackupItemInterface } from '../../interface/cloud-backup-item.interface';

interface Props {
    readonly deviceName: string;
    readonly backups: readonly CloudBackupItemInterface[];
}

export const CloudBackupGroup = ({ deviceName, backups }: Props) => (
    <GroupedListSection title={deviceName}>
        {backups.map(backup => (
            <CloudBackupRow key={backup.recordName} {...backup} />
        ))}
    </GroupedListSection>
);
