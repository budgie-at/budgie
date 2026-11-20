import { UserIconNameEnum } from '@budgie/contracts';

import { Icon } from '../../../@generic/component/icon/icon';

const CHEVRON_SIZE = 13;

export const YieldRowChevron = () => (
    <Icon icon={UserIconNameEnum.ChevronRight} size={CHEVRON_SIZE} className="text-secondary-foreground/60" />
);
