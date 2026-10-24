import { UserIconType } from '@budgie/contracts';
import { ComponentProps } from 'react';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props extends ComponentProps<typeof SimpleHorizontalCell> {
    readonly icon?: UserIconType;
    readonly variant?: ColorPaletteVariant;
    readonly isLoading?: boolean;
}

export const SettingsCard = ({ icon, variant, isLoading = false, disabled, right, left, ...rest }: Props) => {
    const rightSlot = <LoadingContent isLoading={isLoading}>{right}</LoadingContent>;
    const isDisabled = Boolean(isLoading || disabled || rest.accessibilityState?.disabled);
    const leftSlot = isDefined(icon) ? <CircleIcon icon={icon} variant={variant} border={false} size={36} iconSize={20} /> : left;
    const accessibilityState = {
        ...rest.accessibilityState,
        busy: Boolean(isLoading || rest.accessibilityState?.busy),
        disabled: isDisabled
    };

    return (
        <SimpleHorizontalCell {...rest} left={leftSlot} disabled={isDisabled} right={rightSlot} accessibilityState={accessibilityState} />
    );
};
