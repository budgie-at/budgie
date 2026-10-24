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

export const SettingsCard = ({ icon, variant, isLoading, disabled, right, left, ...rest }: Props) => {
    const rightSlot = isDefined(isLoading) ? (
        <LoadingContent isLoading={isLoading} className="min-h-[20px] min-w-[20px] items-center justify-center">
            {right}
        </LoadingContent>
    ) : (
        right
    );
    const isDisabled = isLoading || disabled;
    const leftSlot = isDefined(icon) ? <CircleIcon icon={icon} variant={variant} border={false} size={36} iconSize={20} /> : left;
    const accessibilityState = { ...rest.accessibilityState, busy: Boolean(isLoading) };

    return (
        <SimpleHorizontalCell {...rest} left={leftSlot} disabled={isDisabled} right={rightSlot} accessibilityState={accessibilityState} />
    );
};
