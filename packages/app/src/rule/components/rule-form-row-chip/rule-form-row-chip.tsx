import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';

import type { RuleOptionMetaInterface } from '../../interface/rule-option-meta.interface';

interface Props {
    readonly meta: Pick<RuleOptionMetaInterface, 'icon' | 'variant'>;
}

export const RuleFormRowChip = ({ meta }: Props) => (
    <CircleIcon
        icon={meta.icon}
        variant={meta.variant}
        size={36}
        iconSize={18}
        radius={18}
        border={false}
        className={TONAL_DISC_BACKGROUND[meta.variant]}
    />
);
