import React, { ReactNode, RefObject, useRef } from 'react';

import { IconName } from '../../constant/icons.constant';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { FormFieldStatus } from '../../type/form-field-status.type';
import { SimpleHorizontalCell } from '../simple-horizontal-cell/simple-horizontal-cell';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly iconVariant?: ColorPaletteVariant;
    readonly className?: string;
    readonly icon: IconName;
    readonly title: string;
    readonly status?: FormFieldStatus;
    readonly description: string;
    readonly titleVariant?: 'primary' | 'secondary';
    readonly renderBottomSheet: (ref: RefObject<BottomSheetInterface | null>) => ReactNode;
}

export const EntitySelector = (props: Props) => {
    const { variant, iconVariant, icon, title, description, renderBottomSheet, status = 'default' } = props;
    const ref = useRef<BottomSheetInterface | null>(null);

    const handleOpen = () => ref.current?.open();

    const cardVariant = status === 'error' ? 'destructive' : 'primary';
    const iconParams = { variant: iconVariant ?? variant };

    return (
        <>
            <SimpleHorizontalCell
                variant={cardVariant}
                title={title}
                description={description}
                icon={icon}
                onPress={handleOpen}
                iconParams={iconParams}
            />

            {renderBottomSheet(ref)}
        </>
    );
};
