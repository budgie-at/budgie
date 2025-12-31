import { MessageDescriptor } from '@lingui/core';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { useMemo } from 'react';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { IconName } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props<T> {
    readonly isSelected: boolean;
    readonly type: T;
    readonly onSelect: (type: T) => void;
    readonly icon: IconName;
    readonly title: MessageDescriptor;
    readonly description: MessageDescriptor;
    readonly iconVariant?: ColorPaletteVariant;
}

const cardVariants = cva('flex-col flex-1', {
    variants: {
        isSelected: { true: 'border-primary' }
    }
});

const CHECK_ICON = <CircleIcon variant="ghost" iconSize={12} size={20} icon="Check" />;

export const SelectableTypeCard = <T,>({
    type,
    onSelect,
    isSelected,
    icon,
    title,
    description,
    iconVariant = 'ghost'
}: Props<T>) => {
    const { i18n } = useLingui();

    const handleSelect = () => void onSelect(type);

    const iconParams = useMemo(() => ({ variant: iconVariant, border: false, size: 40, iconSize: 20 }), [iconVariant]);

    const right = isSelected ? CHECK_ICON : null;

    return (
        <SimpleHorizontalCell
            right={right}
            onPress={handleSelect}
            iconParams={iconParams}
            contentClassName="items-center"
            icon={icon}
            title={i18n.t(title)}
            className={cardVariants({ isSelected })}
            description={i18n.t(description)}
        />
    );
};
