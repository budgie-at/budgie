import { UserIconNameEnum } from '@budgie/contracts';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';

export const TransactionInfoHeroIcon = () => (
    <CircleIcon
        icon={UserIconNameEnum.ArrowRightLeft}
        variant="default"
        size={64}
        iconSize={30}
        radius={32}
        border={false}
        iconClassName="text-default-foreground"
    />
);
