import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';

import type { UserIconNameEnum } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly title: string;
    readonly description: string;
}

export const ApplePayCaptureTroubleshootingRow = ({ icon, title, description }: Props) => (
    <GroupedListRow title={title} subtitle={description} left={<GroupedListIcon icon={icon} />} />
);
