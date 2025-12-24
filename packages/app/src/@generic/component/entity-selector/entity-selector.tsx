import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { ReactNode, RefObject, useRef } from 'react';

import { IconName } from '../../constant/icons.constant';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { FormFieldStatus } from '../../type/form-field-status.type';
import { HorizontalCell } from '../horizontal-cell/horizontal-cell';
import { cn } from '../../utils/cn.util';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly iconVariant?: ColorPaletteVariant;
    readonly className?: string;
    readonly icon: IconName;
    readonly title?: string;
    readonly status?: FormFieldStatus;
    readonly description?: string;
    readonly titleVariant?: 'primary' | 'secondary';
    readonly renderBottomSheet: (ref: RefObject<BottomSheetInterface | null>) => ReactNode;
}

const cardVariants = cva<{ status: Record<FormFieldStatus, ClassValue> }>('flex-row items-center gap-x-xl', {
    variants: {
        status: {
            default: '',
            error: 'bg-destructive-background/5 border-destructive-corner'
        }
    }
});

export const EntitySelector = (props: Props) => {
    const { variant, iconVariant, className, icon, title, description, renderBottomSheet, titleVariant, status = 'default' } = props;
    const ref = useRef<BottomSheetInterface | null>(null);

    const handleOpen = () => ref.current?.open();

    const cardVariant = status === 'error' ? 'destructive' : variant;

    return (
        <>
            <HorizontalCell
                className={cn(cardVariants({ status }), className)}
                onPress={handleOpen}
                icon={icon}
                variant={cardVariant}
                title={title}
                iconVariant={iconVariant}
                titleVariant={titleVariant}
                description={description}
            />

            {renderBottomSheet(ref)}
        </>
    );
};
