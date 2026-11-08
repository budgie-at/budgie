import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { FormsheetHeader } from '../../../@generic/component/formsheet-header/formsheet-header';
import { GroupedListCheckRow } from '../../../@generic/component/grouped-list-check-row/grouped-list-check-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
import { useMorphingSheetCommit } from '../../../@generic/hook/use-morphing-sheet-commit.hook';
import { useMorphingSheetListHeight } from '../../../@generic/hook/use-morphing-sheet-list-height.hook';
import { ImportColumnMapperModalSelector } from '../../../app/import-column-mapper.selector';

import type { ImportColumnMapperResult } from '../../context/import-column-mapper-modal.context';

const sortHeaders = (first: string, second: string): number => first.localeCompare(second);

interface Props {
    readonly samples: Record<string, readonly string[]>;
    readonly headers: string[];
    readonly selectedHeaders: string[];
    readonly currentValue: string | undefined;
    readonly fieldLabel: string;
    readonly isRequired: boolean;
    readonly onCommit: (result: ImportColumnMapperResult) => void;
}

export const ImportColumnMapperModalContent = (props: Props) => {
    const { samples, headers, selectedHeaders, currentValue, fieldLabel, isRequired, onCommit } = props;
    const { t } = useLingui();
    const { height } = useMorphingSheetListHeight(MORPHING_SHEET_SELECTOR_HEIGHT_RATIO);
    const commit = useMorphingSheetCommit(onCommit);
    const availableHeaders = headers.filter(header => header === currentValue || !selectedHeaders.includes(header)).sort(sortHeaders);
    const availableCount = availableHeaders.length;
    const canClear = !isRequired || isNotEmptyString(currentValue);
    const description = t({
        message: plural(availableCount, {
            one: '# column available',
            other: '# columns available'
        })
    });
    const listStyle = { height };

    const handleSelect = (header: string) => () => {
        void commit({ type: 'select', header });
    };

    const handleClear = () => void commit({ type: 'clear' });

    return (
        <View style={listStyle}>
            <SheetSurface className="pt-lg" header={<FormsheetHeader size="sm" title={fieldLabel} description={description} />}>
                <ScrollView className="flex-1" contentContainerClassName="px-5xl pb-5xl" showsVerticalScrollIndicator={false}>
                    <GroupedListSection>
                        {canClear ? (
                            <GroupedListCheckRow
                                title={t`None`}
                                onPress={handleClear}
                                testID={ImportColumnMapperModalSelector.ClearSelected}
                                isSelected={!isNotEmptyString(currentValue)}
                            />
                        ) : null}
                        {availableHeaders.map(header => (
                            <GroupedListCheckRow
                                key={header}
                                title={header}
                                titleNumberOfLines={2}
                                subtitle={samples[header]?.[0]}
                                isSelected={header === currentValue}
                                onPress={handleSelect(header)}
                                testID={ImportColumnMapperModalSelector.Header(header)}
                            />
                        ))}
                    </GroupedListSection>
                    {isNotEmptyArray(availableHeaders) ? null : (
                        <View className="items-center py-5xl">
                            <Text className="text-secondary-foreground text-[13px]">{t`All columns are already matched`}</Text>
                        </View>
                    )}
                </ScrollView>
            </SheetSurface>
        </View>
    );
};
