import { CircleIcon } from '../circle-icon/circle-icon';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconType;
}

export const NeutralIconTile = ({ icon }: Props) => (
    <CircleIcon
        icon={icon}
        size={40}
        iconSize={20}
        radius={10}
        variant="ghost"
        border={false}
        className="bg-surface-disc"
        iconClassName="text-primary"
    />
);
