import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { ReactNode, RefObject, useRef } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ICONS, IconName } from '../../constant/icons.constant';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { FormFieldStatus } from '../../type/form-field-status.type';
import { cn } from '../../utils/cn.util';
import { Card } from '../card/card';
import { CircleIcon } from '../circle-icon/circle-icon';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly className?: string;
    readonly icon: IconName;
    readonly emptyStateText: string;
    readonly title?: string;
    readonly status?: FormFieldStatus;
    readonly subtitle?: ReactNode | null;
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
    const { variant, className, icon, emptyStateText, title, subtitle, renderBottomSheet, status = 'default' } = props;
    const ref = useRef<BottomSheetInterface | null>(null);

    const handleOpen = () => ref.current?.open();

    const hasSelection = isDefined(title);

    const iconVariant = status === 'error' ? 'destructive' : variant;

    return (
        <>
            <Card onPress={handleOpen} className={cn(cardVariants({ status }), className)}>
                <CircleIcon size="lg" icon={ICONS[icon]} variant={iconVariant} />

                {hasSelection ? (
                    <View className="mr-auto">
                        <Text className="text-sm text-primary font-semibold">{title}</Text>
                        {subtitle}
                    </View>
                ) : (
                    <Text className="flex-1 text-center font-semibold text-primary text-sm">{emptyStateText}</Text>
                )}

                <CircleIcon icon={ICONS.ChevronRight} className="bg-transparent border-0" variant="ghost" />
            </Card>

            {renderBottomSheet(ref)}
        </>
    );
};
