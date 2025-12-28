import { useLingui } from '@lingui/react/macro';
import { RefObject } from 'react';
import { Pressable, Text, View } from 'react-native';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '../../../@generic/component/bottom-sheet-header/bottom-sheet-header';
import { BottomSheetScrollView } from '../../../@generic/component/bottom-sheet-scroll-view/bottom-sheet-scroll-view';
import { Button } from '../../../@generic/component/button/button';
import { Footer } from '../../../@generic/component/footer/footer';
import { Icon } from '../../../@generic/component/icon/icon';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ImportColumnMapperOption } from '../import-column-mapper-option/import-column-mapper-option';

interface Props {
    readonly headers: string[];
    readonly selectedHeaders: string[];
    readonly currentValue: string | undefined;
    readonly fieldLabel: string;
    readonly onSelect: (header: string) => void;
    readonly onClear: () => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
}

const sortHeaders = (first: string, second: string): number => first.localeCompare(second);

const snapPoints = ['70%'];

export const ImportColumnMapperBottomSheet = ({ ref, headers, selectedHeaders, currentValue, fieldLabel, onSelect, onClear }: Props) => {
    const { t } = useLingui();

    const availableHeaders = headers.filter(header => header === currentValue || !selectedHeaders.includes(header)).sort(sortHeaders);
    const hasCurrentValue = isNotEmptyString(currentValue);
    const availableCount = availableHeaders.length;
    const description = t`${availableCount} columns available`;

    const handleClose = () => ref.current?.close();
    const handleSelect = (header: string) => () => {
        onSelect(header);
        ref.current?.close();
    };
    const handleClear = () => {
        onClear();
        ref.current?.close();
    };

    return (
        <BottomSheet snapPoints={snapPoints} ref={ref}>
            <BottomSheetHeader className="border-b border-b-secondary-corner" size="md" title={fieldLabel} description={description} />

            {hasCurrentValue && (
                <View className="px-3xl pt-3xl pb-md border-b border-b-secondary-corner">
                    <Text className="text-secondary-foreground uppercase mb-sm text-xs font-medium">{t`Selected`}</Text>
                    <Pressable
                        onPress={handleClear}
                        className="p-3xl rounded-xl bg-positive-background/10 border border-positive-corner flex-row items-center justify-between"
                    >
                        <Text className="text-primary text-sm font-semibold">{currentValue}</Text>
                        <View className="flex-row items-center gap-x-sm">
                            <Text className="text-destructive-foreground text-xs">{t`Tap to clear`}</Text>
                            <Icon icon="X" size={16} className="text-destructive-foreground" />
                        </View>
                    </Pressable>
                </View>
            )}

            <BottomSheetScrollView contentContainerClassName="pt-3xl px-3xl gap-y-md pb-5xl">
                <Text className="text-secondary-foreground uppercase mb-sm text-xs font-medium">{t`Available Columns`}</Text>

                {isNotEmptyArray(availableHeaders) ? (
                    <View className="gap-y-xs">
                        {availableHeaders.map(header => (
                            <ImportColumnMapperOption
                                key={header}
                                header={header}
                                isSelected={header === currentValue}
                                onSelect={handleSelect(header)}
                            />
                        ))}
                    </View>
                ) : (
                    <View className="items-center py-5xl">
                        <Text className="text-secondary-foreground text-sm">{t`All columns have been assigned`}</Text>
                    </View>
                )}
            </BottomSheetScrollView>

            <Footer>
                <Button content={t`Done`} variant="secondary" onPress={handleClose} />
            </Footer>
        </BottomSheet>
    );
};
