import { CircleIcon } from '../circle-icon/circle-icon';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconType;
    readonly iconClassName?: string;
}

export const NeutralIconTile = ({ icon, iconClassName = 'text-primary' }: Props) => (
    <CircleIcon
        icon={icon}
        size={40}
        iconSize={20}
        radius={10}
        variant="ghost"
        border={false}
        className="bg-surface-disc"
        iconClassName={iconClassName}
    />
);
