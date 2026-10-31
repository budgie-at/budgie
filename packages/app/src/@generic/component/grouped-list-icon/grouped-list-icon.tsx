import { CircleIcon } from '../circle-icon/circle-icon';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconType;
    readonly iconClassName?: string;
}

export const GroupedListIcon = ({ icon, iconClassName }: Props) => (
    <CircleIcon
        icon={icon}
        variant="secondary"
        size={36}
        iconSize={18}
        radius={18}
        border={false}
        className="bg-surface-disc"
        iconClassName={iconClassName}
    />
);
