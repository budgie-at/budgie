import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { FormsheetHeader } from '../@generic/component/formsheet-header/formsheet-header';
import { GroupedListCheckRow } from '../@generic/component/grouped-list-check-row/grouped-list-check-row';
import { GroupedListRow } from '../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../@generic/component/grouped-list-section/grouped-list-section';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useImportColumnMapperModal, useImportColumnMapperModalParams } from '../import/context/import-column-mapper-modal.context';

import { ImportColumnMapperModalSelector } from './import-column-mapper.selector';

const sortHeaders = (first: string, second: string): number => first.localeCompare(second);

export default function ImportColumnMapperModal() {
    const { t } = useLingui();
    const [, resolveImportColumnMapper, dismissImportColumnMapper] = useImportColumnMapperModal();
    useModalDismiss(dismissImportColumnMapper);
    const currentParams = useImportColumnMapperModalParams();

    const { headers = [], selectedHeaders = [], currentValue, fieldLabel = '', isRequired = false } = currentParams ?? {};

    const availableHeaders = headers.filter(header => header === currentValue || !selectedHeaders.includes(header)).sort(sortHeaders);
    const availableCount = availableHeaders.length;
    const canClear = !isRequired || isNotEmptyString(currentValue);
    const description = t({
        message: plural(availableCount, {
            one: '# column available',
            other: '# columns available'
        })
    });

    const handleSelect = (header: string) => () => {
        resolveImportColumnMapper({ type: 'select', header });
    };

    const handleClear = () => {
        resolveImportColumnMapper({ type: 'clear' });
    };

    return (
        <View className="flex-1 bg-secondary-background">
            <ScrollView contentContainerClassName="px-5xl pb-5xl" showsVerticalScrollIndicator={false}>
                <FormsheetHeader size="sm" title={fieldLabel} description={description} />
                <GroupedListSection>
                    {canClear ? (
                        <GroupedListRow
                            title={t`None`}
                            onPress={handleClear}
                            testID={ImportColumnMapperModalSelector.ClearSelected}
                            right={<View />}
                        />
                    ) : null}
                    {availableHeaders.map(header => (
                        <GroupedListCheckRow
                            key={header}
                            title={header}
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
        </View>
    );
}
