import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { GroupedListRow } from '../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../@generic/component/grouped-list-section/grouped-list-section';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { ImportColumnMapperOption } from '../import/components/import-column-mapper-option/import-column-mapper-option';
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
            <View className="px-5xl pt-3xl pb-xl gap-y-xs">
                <Text className="text-primary text-[17px] font-semibold" numberOfLines={1}>
                    {fieldLabel}
                </Text>
                <Text className="text-secondary-foreground text-[13px]">{description}</Text>
            </View>
            <ScrollView contentContainerClassName="px-5xl pb-5xl" showsVerticalScrollIndicator={false}>
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
                        <ImportColumnMapperOption
                            key={header}
                            header={header}
                            isSelected={header === currentValue}
                            onSelect={handleSelect(header)}
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
