import { useLingui } from '@lingui/react/macro';
import { RefObject, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/components/card/card';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { cn } from '../../../@generic/utils/cn.util';
import { ImportColumnMapperBottomSheet } from '../import-column-mapper-bottom-sheet/import-column-mapper-bottom-sheet';

interface Props {
    readonly value: string | undefined;
    readonly headers: string[];
    readonly selectedHeaders: string[];
    readonly fieldLabel: string;
    readonly onSelect: (header: string) => void;
    readonly hasError?: boolean;
    readonly onClear: () => void;
}

export const ImportColumnMapper = ({ value, headers, selectedHeaders, fieldLabel, onSelect, onClear, hasError = false }: Props) => {
    const { t } = useLingui();
    const bottomSheetRef: RefObject<BottomSheetInterface | null> = useRef<BottomSheetInterface | null>(null);

    const hasValue = isNotEmptyString(value);

    const handleOpen = () => void bottomSheetRef.current?.open();

    const cardClassName = cn('p-3xl', hasError && 'border-destructive-corner');

    return (
        <>
            <Card className={cardClassName}>
                <Pressable onPress={handleOpen} className="flex-row items-center justify-between">
                    <Text className={cn('text-primary text-md flex-1', !hasValue && 'text-secondary-foreground')}>
                        {hasValue ? value : t`Select column...`}
                    </Text>
                    <View className="flex-row items-center gap-x-sm">
                        <Icon icon={ICONS.ChevronRight} size={20} className="text-secondary-foreground" />
                    </View>
                </Pressable>
            </Card>

            <ImportColumnMapperBottomSheet
                ref={bottomSheetRef}
                headers={headers}
                selectedHeaders={selectedHeaders}
                currentValue={value}
                fieldLabel={fieldLabel}
                onSelect={onSelect}
                onClear={onClear}
            />
        </>
    );
};
