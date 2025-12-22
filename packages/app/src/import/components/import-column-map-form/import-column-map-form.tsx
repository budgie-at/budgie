import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '../../../@generic/components/button/button';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { ImporterColumnMapInterface } from '../../interface/importer-column-map.interface';
import { ImportColumnMapFormValues, ImportColumnMapSchema } from '../../schema/import-column-map.schema';
import { ImportColumnMapField } from '../import-column-map-field/import-column-map-field';

interface Props {
    readonly headers: string[];
    readonly onStartImport: (columnMap: ImporterColumnMapInterface) => void;
    readonly rowCount: number;
}

// HINT: SmartBudget2 columns
const DEFAULT_VALUES: ImportColumnMapFormValues = {
    // eslint-disable-next-line lingui/no-unlocalized-strings
    externalId: 'Порядковый номер',
    fromAccount: 'Счёт_1',
    toAccount: 'Счёт',
    category: 'Категория',
    operatedAt: 'Дата',
    comment: 'Описание',
    amount: 'Сумма',
    toCurrency: 'Валюта',
    // eslint-disable-next-line lingui/no-unlocalized-strings
    fromCurrency: 'Валюта 2'
};

export const ImportColumnMapForm = ({ headers, onStartImport, rowCount }: Props) => {
    const { t } = useLingui();

    const headersSet = new Set(headers);

    const schemaWithHeaders = ImportColumnMapSchema.refine(data => headersSet.has(data.toAccount), {
        message: t`Select a valid column`,
        path: ['toAccount']
    })
        .refine(data => headersSet.has(data.category), { message: t`Select a valid column`, path: ['category'] })
        .refine(data => headersSet.has(data.operatedAt), { message: t`Select a valid column`, path: ['operatedAt'] })
        .refine(data => headersSet.has(data.amount), { message: t`Select a valid column`, path: ['amount'] })
        .refine(data => headersSet.has(data.toCurrency), { message: t`Select a valid column`, path: ['toCurrency'] });

    const {
        control,
        handleSubmit,
        formState: { errors }
    } = useForm<ImportColumnMapFormValues>({
        resolver: zodResolver(schemaWithHeaders),
        defaultValues: DEFAULT_VALUES,
        mode: 'onSubmit'
    });

    const onSubmit = (data: ImportColumnMapFormValues) => void onStartImport(data);

    const handleCancel = () => void router.back();

    const hasErrors = Object.keys(errors).length > 0;
    const buttonContent = hasErrors ? t`Fix Errors` : t`Start Import`;

    return (
        <View className="flex-1">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="gap-y-xl pb-5xl pt-3xl">
                <View className="items-center gap-y-md pb-xl">
                    <CircleIcon icon={ICONS.FileText} variant="default" size="2xl" />
                    <Text className="text-primary text-xl font-semibold">{t`Map CSV Columns`}</Text>
                    <Text className="text-secondary-foreground text-sm text-center">{t`Match each field to a column from your CSV file`}</Text>
                    <View className="bg-secondary-background px-3xl py-md rounded-full">
                        <Text className="text-primary text-sm font-medium">{t`${rowCount} rows found`}</Text>
                    </View>
                </View>

                <ImportColumnMapField control={control} name="toAccount" label={t`To Account`} headers={headers} isRequired />
                <ImportColumnMapField control={control} name="category" label={t`Category`} headers={headers} isRequired />
                <ImportColumnMapField control={control} name="operatedAt" label={t`Date`} headers={headers} isRequired />
                <ImportColumnMapField control={control} name="amount" label={t`Amount`} headers={headers} isRequired />
                <ImportColumnMapField control={control} name="toCurrency" label={t`To Currency`} headers={headers} isRequired />
                <ImportColumnMapField control={control} name="externalId" label={t`External ID`} headers={headers} />
                <ImportColumnMapField control={control} name="fromAccount" label={t`From Account`} headers={headers} />
                <ImportColumnMapField control={control} name="fromCurrency" label={t`From Currency`} headers={headers} />
                <ImportColumnMapField control={control} name="comment" label={t`Comment`} headers={headers} />
            </ScrollView>

            <View className="pt-xl pb-xl flex-row gap-x-md">
                <View className="flex-1">
                    <Button content={t`Cancel`} variant="ghost" onPress={handleCancel} />
                </View>
                <View className="flex-2">
                    <Button content={buttonContent} variant="positive" onPress={handleSubmit(onSubmit)} leftIcon="Database" />
                </View>
            </View>
        </View>
    );
};
