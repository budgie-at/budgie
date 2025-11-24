import { ReactNode, RefObject, useRef } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ICONS, IconName } from '../../constant/icons.constant';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { Card } from '../card/card';
import { CircleIcon } from '../circle-icon/circle-icon';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly className?: string;
    readonly icon: IconName;
    readonly emptyStateText: string;
    readonly title?: string;
    readonly subtitle?: ReactNode | null;
    readonly renderBottomSheet: (ref: RefObject<BottomSheetInterface | null>) => ReactNode;
}

export const EntitySelector = ({ variant, className, icon, emptyStateText, title, subtitle, renderBottomSheet }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);

    const handleOpen = () => ref.current?.open();

    const hasSelection = isDefined(title);

    return (
        <>
            <Card onPress={handleOpen} className={cn('flex-row items-center gap-x-xl', className)}>
                <CircleIcon size="lg" icon={ICONS[icon]} variant={variant} />

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
