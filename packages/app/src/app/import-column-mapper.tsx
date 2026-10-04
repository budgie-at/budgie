import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../@generic/component/button/button';
import { Footer } from '../@generic/component/footer/footer';
import { Icon } from '../@generic/component/icon/icon';
import { ImportColumnMapperOption } from '../import/components/import-column-mapper-option/import-column-mapper-option';
import { useImportColumnMapperModal, useImportColumnMapperModalParams } from '../import/context/import-column-mapper-modal.context';

import { ImportColumnMapperModalSelector } from './import-column-mapper.selector';

const sortHeaders = (first: string, second: string): number => first.localeCompare(second);

export default function ImportColumnMapperModal() {
    const { t } = useLingui();
    const [, resolveImportColumnMapper] = useImportColumnMapperModal();
    const currentParams = useImportColumnMapperModalParams();

    const headers = currentParams?.headers ?? [];
    const selectedHeaders = currentParams?.selectedHeaders ?? [];
    const currentValue = currentParams?.currentValue;
    const fieldLabel = currentParams?.fieldLabel ?? '';

    const availableHeaders = headers.filter(header => header === currentValue || !selectedHeaders.includes(header)).sort(sortHeaders);
    const hasCurrentValue = isNotEmptyString(currentValue);
    const availableCount = availableHeaders.length;
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

    const handleDone = () => {
        resolveImportColumnMapper(null);
    };

    return (
        <View className="flex-1 bg-primary-reverse">
            <View className="border-b border-b-secondary-corner px-3xl pt-3xl pb-xl">
                <Text className="text-primary text-lg font-semibold">{fieldLabel}</Text>
                <Text className="text-secondary-foreground text-sm">{description}</Text>
            </View>

            {hasCurrentValue && (
                <View className="px-3xl pt-3xl pb-md border-b border-b-secondary-corner">
                    <Text className="text-secondary-foreground uppercase mb-sm text-xs font-medium">{t`Selected`}</Text>
                    <Pressable
                        onPress={handleClear}
                        className="p-3xl rounded-xl bg-positive-background/10 border border-positive-corner flex-row items-center justify-between"
                        testID={ImportColumnMapperModalSelector.ClearSelected}
                    >
                        <Text className="text-primary text-sm font-semibold">{currentValue}</Text>
                        <View className="flex-row items-center gap-x-sm">
                            <Text className="text-destructive-foreground text-xs">{t`Tap to clear`}</Text>
                            <Icon icon={UserIconNameEnum.X} size={16} className="text-destructive-foreground" />
                        </View>
                    </Pressable>
                </View>
            )}

            <ScrollView contentContainerClassName="pt-3xl px-3xl gap-y-md pb-5xl" showsVerticalScrollIndicator={false}>
                <Text className="text-secondary-foreground uppercase mb-sm text-xs font-medium">{t`Available Columns`}</Text>

                {isNotEmptyArray(availableHeaders) ? (
                    <View className="gap-y-xs">
                        {availableHeaders.map(header => (
                            <ImportColumnMapperOption
                                key={header}
                                header={header}
                                isSelected={header === currentValue}
                                onSelect={handleSelect(header)}
                                testID={ImportColumnMapperModalSelector.Header(header)}
                            />
                        ))}
                    </View>
                ) : (
                    <View className="items-center py-5xl">
                        <Text className="text-secondary-foreground text-sm">{t`All columns have been assigned`}</Text>
                    </View>
                )}
            </ScrollView>

            <Footer>
                <Button content={t`Done`} variant="secondary" onPress={handleDone} testID={ImportColumnMapperModalSelector.Done} />
            </Footer>
        </View>
    );
}
