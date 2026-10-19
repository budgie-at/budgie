import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { Icon } from '../../../@generic/component/icon/icon';
import { useI18nContext } from '../../../i18n/context/i18n.context';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { OnboardingReceiptCard } from '../../../onboarding/component/onboarding-receipt-card/onboarding-receipt-card';
import { FileImportReviewRow } from '../file-import-review-row/file-import-review-row';

import { FileImportReviewStepSelector } from './file-import-review-step.selector';

import type { FileBankSyncImportReviewInterface } from '@budgie/sync';

const DATE_FORMAT = { day: 'numeric', month: 'long', year: 'numeric' } as const;

interface Props {
    readonly review: FileBankSyncImportReviewInterface;
    readonly fileName: string;
}

export const FileImportReviewStep = ({ review, fileName }: Props) => {
    const { t } = useLingui();
    const { intl } = useI18nContext();
    const formatDigits = useDisplayFormatDigits();

    const { parsedTransactionCount, duplicateTransactionCount, earliestOperatedAt, latestOperatedAt } = review;
    const foundLabel = t({ message: plural(parsedTransactionCount, { one: '# transaction found', other: '# transactions found' }) });
    const dateRange =
        isDefined(earliestOperatedAt) && isDefined(latestOperatedAt)
            ? `${intl.formatDate(earliestOperatedAt, DATE_FORMAT)} – ${intl.formatDate(latestOperatedAt, DATE_FORMAT)}`
            : null;
    const importInto = review.accounts.map(account => account.title).join(', ');
    const duplicatesLabel = isPositiveNumber(duplicateTransactionCount)
        ? t({ message: plural(duplicateTransactionCount, { one: '# skipped', other: '# skipped' }) })
        : t`None`;
    const closingBalances = review.accounts
        .filter(account => isDefined(account.closingBalance))
        .map(({ title, currencyCode, closingBalance }) => ({
            label: t`Closing balance · ${title}`,
            value: `${formatDigits(closingBalance ?? 0)} ${currencyCode}`
        }));
    const summaryRows = [
        { label: t`Import into`, value: importInto },
        { label: t`Already in Budgie`, value: duplicatesLabel },
        ...closingBalances
    ];

    return (
        <View testID={FileImportReviewStepSelector.Root} className="gap-y-xl">
            <Card variant="secondary" size="md" className="flex-row items-center gap-x-lg">
                <Icon icon={UserIconNameEnum.FileText} size={20} className="text-primary" />
                <View className="flex-1">
                    <Text className="text-primary text-sm font-semibold" numberOfLines={1}>
                        {fileName}
                    </Text>
                    <Text className="text-secondary-foreground text-xs">
                        <Trans>Read on this phone</Trans>
                    </Text>
                </View>
            </Card>

            <View className="gap-y-xs px-md">
                <Text className="text-primary text-2xl font-semibold">{foundLabel}</Text>
                {isDefined(dateRange) ? <Text className="text-secondary-foreground text-sm">{dateRange}</Text> : null}
            </View>

            <Card variant="secondary" size="md" className="py-xs">
                {review.sampleTransactions.map(transaction => (
                    <FileImportReviewRow key={transaction.externalId} transaction={transaction} />
                ))}
            </Card>

            <OnboardingReceiptCard rows={summaryRows} />

            <Text className="text-secondary-foreground text-xs px-md">
                <Trans>Transactions already in Budgie are skipped. Nothing is written until you import.</Trans>
            </Text>
        </View>
    );
};
