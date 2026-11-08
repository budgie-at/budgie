import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';
import { PageHeaderSelector } from '../page-header/page-header.selector';

interface Props {
    readonly onPress: () => void;
}

export const EntityFormBackButton = ({ onPress }: Props) => {
    const { t } = useLingui();

    return (
        <HapticPressable
            onPress={onPress}
            accessible
            accessibilityRole="button"
            accessibilityLabel={t`Back`}
            className="h-[36px] w-[36px] items-center justify-center rounded-full bg-surface-fill active:opacity-70"
            collapsable={false}
            nativeID={PageHeaderSelector.BackButton}
            testID={PageHeaderSelector.BackButton}
        >
            <Icon icon={UserIconNameEnum.ChevronLeft} size={20} className="text-primary" />
        </HapticPressable>
    );
};
