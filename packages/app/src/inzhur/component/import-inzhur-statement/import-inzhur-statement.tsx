import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { FixedChromePage } from '../../../@generic/component/fixed-chrome-page/fixed-chrome-page';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { PillButtonFooter } from '../../../@generic/component/pill-button-footer/pill-button-footer';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { NumberedSteps } from '../../../sync/component/numbered-steps/numbered-steps';
import { useInzhurStatementImport } from '../../hook/use-inzhur-statement-import.hook';
import { useInzhurSetupQuery } from '../../query/use-inzhur-setup.query';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurImportSummaryFooter } from '../inzhur-import-summary-footer/inzhur-import-summary-footer';
import { InzhurImportSummary } from '../inzhur-import-summary/inzhur-import-summary';

export const ImportInzhurStatement = () => {
    const { t } = useLingui();
    const { isLoading, summary, handleSelectFile } = useInzhurStatementImport();
    const { setup } = useInzhurSetupQuery();
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();

    const exportSteps = [
        t`Open the Inzhur app`,
        { title: t`Download your account statement`, caption: t`«Виписка про стан рахунку» · PDF` }
    ];
    const lastStatementDate = isDefined(setup?.lastStatementDate) ? formatMonthAndDayAndOptionalYear(setup.lastStatementDate) : null;

    if (isDefined(summary)) {
        return (
            <GroupedSurface>
                <FixedChromePage title={t`Statement imported`} testID={InzhurSelector.ImportPage} footer={<InzhurImportSummaryFooter />}>
                    <InzhurImportSummary summary={summary} />
                </FixedChromePage>
            </GroupedSurface>
        );
    }

    return (
        <GroupedSurface>
            <FixedChromePage
                title={t`Import statement`}
                leading={<HeaderBackButton />}
                testID={InzhurSelector.ImportPage}
                footer={
                    <PillButtonFooter
                        label={t`Choose PDF statement`}
                        isLoading={isLoading}
                        testID={InzhurSelector.SelectFileButton}
                        onPress={handleSelectFile}
                    />
                }
            >
                <Text className="px-3xl text-[15px] leading-[20px] text-secondary-foreground">
                    <Trans>
                        Budgie reads your Inzhur account statement, updates certificates and cash, and records buys and dividends for you.
                    </Trans>
                </Text>
                <View className="gap-y-md">
                    <NumberedSteps title={t`How to export`} steps={exportSteps} />
                    <Text className="px-3xl text-[13px] leading-[18px] text-secondary-foreground">
                        <Trans>Read on your device. Nothing is uploaded.</Trans>
                    </Text>
                    {isDefined(lastStatementDate) ? (
                        <Text className="px-3xl text-[13px] leading-[18px] text-secondary-foreground" testID={InzhurSelector.LastImported}>
                            {t`Last imported: ${lastStatementDate} statement`}
                        </Text>
                    ) : null}
                </View>
            </FixedChromePage>
        </GroupedSurface>
    );
};
