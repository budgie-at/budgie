import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly title: string;
    readonly onPress: () => void;
}

const HIT_SLOP = { left: 6, right: 6 } as const;

export const BudgetCategoryLimitRemoveButton = ({ title, onPress }: Props) => {
    const { t } = useLingui();

    return (
        <HapticPressable
            accessibilityRole="button"
            accessibilityLabel={t`Remove ${title} limit`}
            className="-mr-sm h-[44px] w-[32px] items-center justify-center active:opacity-60"
            hitSlop={HIT_SLOP}
            onPress={onPress}
        >
            <Icon icon={UserIconNameEnum.CircleX} size={20} className="text-secondary-foreground" />
        </HapticPressable>
    );
};
