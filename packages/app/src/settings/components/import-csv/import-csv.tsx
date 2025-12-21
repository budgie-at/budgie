/* eslint-disable lingui/no-unlocalized-strings,max-lines */
import {
    AccountCreateEntityInterface,
    AccountEntityInterface,
    AccountNatureEnum,
    AccountTypeEnum,
    CategoryCreateEntityInterface,
    CategoryEntityInterface,
    InstrumentEntityInterface,
    TransactionCreateEntityInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { parse } from 'date-fns';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import * as DocumentPicker from 'expo-document-picker';
import Papa, { ParseResult } from 'papaparse';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { categoryRepository, instrumentRepository } from '../../../@generic/drizzle/db/db';
import { accountService } from '../../../account/service/account.service';
import { transactionService } from '../../../transaction/service/transaction.service';
import { SettingsCard } from '../settings-card/settings-card';

interface ColumnMap {
    externalId: string;
    fromAccount: string;
    toAccount: string;
    category: string;
    operatedAt: string;
    comment: string;
    amount: string;
    fromCurrency: string;
    toCurrency: string;
}

const columnMap: ColumnMap = {
    externalId: 'Порядковый номер',
    fromAccount: 'Счёт_1',
    toAccount: 'Счёт',
    category: 'Категория',
    operatedAt: 'Дата',
    comment: 'Описание',
    amount: 'Сумма',
    toCurrency: 'Валюта',
    fromCurrency: 'Валюта 2'
};

const parseCsvRows = async (csvText: string, onRow: (row: Record<string, string>) => void) =>
    new Promise<void>((resolve, reject) => {
        Papa.parse<Record<string, string>>(csvText, {
            header: true,
            skipEmptyLines: true,
            chunk: ({ data }: ParseResult<Record<string, string>>) => {
                for (const row of data) {
                    onRow(row);
                }
            },
            complete: () => void resolve(),
            error: (error: Error) => void reject(error)
        });
    });

const normalizeRow = (row: Record<string, string>): Record<keyof ColumnMap, string> => {
    const externalId = row[columnMap.externalId].trim();
    const fromAccount = row[columnMap.fromAccount].toLowerCase().trim();
    const toAccount = row[columnMap.toAccount].toLowerCase().trim();
    const category = row[columnMap.category].toLowerCase().trim();
    const operatedAt = row[columnMap.operatedAt].toLowerCase().trim();
    const comment = row[columnMap.comment].trim();
    const amount = row[columnMap.amount].trim();
    const fromCurrency = row[columnMap.fromCurrency].toUpperCase().trim();
    const toCurrency = row[columnMap.toCurrency].toUpperCase().trim();

    return {
        externalId,
        toAccount,
        fromAccount,
        category,
        operatedAt,
        comment,
        amount,
        fromCurrency,
        toCurrency
    } satisfies Record<keyof ColumnMap, string>;
};

// TODO: Implement dynamic column mapping

// eslint-disable-next-line max-lines-per-function
export const ImportCsv = () => {
    const { t } = useLingui();
    const [importing, setImporting] = useState(false);

    const { data: instruments } = useLiveQuery(instrumentRepository.findAll(), []);
    const instrumentsMap = instruments.reduce<Record<string, InstrumentEntityInterface>>(
        (acc, instrument) => ({ ...acc, [instrument.code]: instrument }),
        {}
    );

    const showSuccess = (successCount: number, errorCount: number) => {
        Toast.show({
            type: 'success',
            text1: t`Import complete`,
            text2: t`${successCount} rows imported, ${errorCount} errors.`
        });
    };

    const showError = () => {
        Toast.show({
            type: 'error',
            text1: t`Import failed`,
            text2: t`Could not import CSV. Please try again.`
        });
    };

    const processTransactions = async (
        fileContent: string,
        accountsMap: Record<string, AccountEntityInterface>,
        categoriesMap: Record<string, CategoryEntityInterface>
    ) => {
        let successCount = 0;
        const errorCount = 0;

        const transactions: TransactionCreateEntityInterface[] = [];

        // eslint-disable-next-line max-statements
        await parseCsvRows(fileContent, row => {
            const normalizedRow = normalizeRow(row);

            const { externalId } = normalizedRow;

            const toAccountKey = `${normalizedRow.toAccount} ${normalizedRow.toCurrency}`;
            const fromAccountKey = `${normalizedRow.fromAccount} ${normalizedRow.fromCurrency}`;

            const toAccount = accountsMap[toAccountKey];
            const fromAccount = accountsMap[fromAccountKey];
            const category = categoriesMap[normalizedRow.category];
            const operatedAt = parse(normalizedRow.operatedAt, 'MM/dd/yyyy HH:mm:ss', new Date());
            const amount = parseFloat(normalizedRow.amount);
            const fromInstrument = instrumentsMap[normalizedRow.fromCurrency];
            const toInstrument = instrumentsMap[normalizedRow.toCurrency];

            if (!isDefined(toAccount)) {
                console.log(`To Account ${normalizedRow.toAccount} in column "${columnMap.toAccount}" not found:`, row);

                return;
            }

            if (!isDefined(category)) {
                console.log(`Category "${normalizedRow.category}" in column "${columnMap.category}" not found`, row);

                return;
            }

            if (!isDefined(operatedAt) || isNaN(operatedAt.getTime())) {
                console.log(`Date "${normalizedRow.operatedAt}" in column "${columnMap.operatedAt}" is invalid`, row);

                return;
            }

            if (!isDefined(amount) || isNaN(amount)) {
                console.log(`Amount "${normalizedRow.amount}" in column "${columnMap.amount} is invalid"`, row);

                return;
            }

            if (!isDefined(toInstrument)) {
                console.log(`To Instrument ${normalizedRow.toCurrency} in column "${columnMap.toCurrency}" not found:`, row);

                return;
            }

            transactions.push({
                amount,
                operatedAt,
                externalId,
                type: TransactionTypeEnum.DEBT,
                title: '',
                externalSource: null,
                comment: normalizedRow.comment,
                toAccountId: toAccount.id,
                fromAccountId: isDefined(fromAccount) ? fromAccount.id : null,
                // TODO: Provide exchange rate?
                exchangeRate: 0,
                tagIds: [],
                entries: [
                    {
                        amount,
                        type: TransactionEntryTypeEnum.CREDIT,
                        instrumentId: toInstrument.id,
                        accountId: toAccount.id,
                        categoryId: category.id
                    },
                    ...(isDefined(fromAccount)
                        ? [
                              {
                                  amount,
                                  type: TransactionEntryTypeEnum.DEBIT,
                                  instrumentId: fromInstrument.id,
                                  accountId: fromAccount.id,
                                  categoryId: category.id
                              }
                          ]
                        : [])
                ]
            } satisfies TransactionCreateEntityInterface);
            // TODO: map row to transaction and insert in DB
            successCount += 1;
        });

        await transactionService.bulkCreate(transactions);

        setImporting(false);
        showSuccess(successCount, errorCount);
    };

    const processAccountsAndCategories = async (fileContent: string) => {
        if (!isNotEmptyString(fileContent)) {
            return;
        }

        const accountInputs = new Map<string, AccountCreateEntityInterface>();
        const categoryInputs = new Map<string, CategoryCreateEntityInterface>();

        await parseCsvRows(fileContent, row => {
            const normalizedRow = normalizeRow(row);

            const toAccountKey = `${normalizedRow.toAccount} ${normalizedRow.toCurrency}`;
            if (!accountInputs.has(toAccountKey) && isNotEmptyString(normalizedRow.toCurrency)) {
                accountInputs.set(toAccountKey, {
                    title: toAccountKey,
                    type: AccountTypeEnum.BANK,
                    icon: UserIconNameEnum.Home,
                    nature: AccountNatureEnum.LIABILITY,
                    instrumentId: instrumentsMap[normalizedRow.toCurrency].id,
                    currentBalance: 0
                });
            }

            const fromAccountKey = `${normalizedRow.fromAccount} ${normalizedRow.fromCurrency}`;
            if (!accountInputs.has(fromAccountKey) && isNotEmptyString(normalizedRow.fromCurrency)) {
                accountInputs.set(fromAccountKey, {
                    title: fromAccountKey,
                    type: AccountTypeEnum.BANK,
                    icon: UserIconNameEnum.Home,
                    nature: AccountNatureEnum.LIABILITY,
                    instrumentId: instrumentsMap[normalizedRow.fromCurrency].id,
                    currentBalance: 0
                });
            }

            if (isNotEmptyString(normalizedRow.category)) {
                categoryInputs.set(normalizedRow.category, { title: normalizedRow.category, icon: UserIconNameEnum.Home });
            }
        });

        const accounts = await accountService.bulkCreate([...accountInputs.values()]);
        const accountsMap = accounts.reduce<Record<string, AccountEntityInterface>>(
            (acc, account) => ({ ...acc, [account.title]: account }),
            {}
        );

        const categories = await categoryRepository.bulkCreate([...categoryInputs.values()]);
        const categoriesMap = categories.reduce<Record<string, CategoryEntityInterface>>(
            (acc, category) => ({ ...acc, [category.title]: category }),
            {}
        );

        await processTransactions(fileContent, accountsMap, categoriesMap);
    };

    const handleFilePick = async () => {
        setImporting(true);

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'text/csv',
                copyToCacheDirectory: true
            });

            if (result.canceled || !result.assets[0]?.uri) {
                setImporting(false);

                return;
            }

            const fileUri = result.assets[0].uri;
            const response = await fetch(fileUri);
            const csvText = await response.text();

            await processAccountsAndCategories(csvText);
        } catch (_e) {
            showError();
            setImporting(false);
        }
    };

    return (
        <View>
            <SettingsCard
                title={t`Import CSV`}
                description={t`Import transactions from a CSV file`}
                left={<CircleIcon size="1_5xl" icon={ICONS.Database} variant="ghost" border={false} />}
                onPress={handleFilePick}
                {...(importing && { right: <ActivityIndicator size="large" color="primary" /> })}
            />
        </View>
    );
};
