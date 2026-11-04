import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { PillButtonFooter } from '../../../@generic/component/pill-button-footer/pill-button-footer';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { NumberedSteps } from '../../../sync/component/numbered-steps/numbered-steps';
import { useInzhurStatementImport } from '../../hook/use-inzhur-statement-import.hook';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurImportSummary } from '../inzhur-import-summary/inzhur-import-summary';

export const ImportInzhurStatement = () => {
    const { t } = useLingui();
    const { isLoading, summary, handleSelectFile } = useInzhurStatementImport();

    const { formatDayAndMonthAndYear } = useFormatDate();

    const exportSteps = [t`Open the Inzhur app`, t`Download «Виписка про стан рахунку»`, t`Choose it here as a PDF`];

    const handleDone = () => void router.dismissTo('/');

    if (isDefined(summary)) {
        const statementDate = formatDayAndMonthAndYear(summary.statementDate);

        return (
            <GroupedSurface>
                <CollapsibleChromePage
                    title={t`Statement imported`}
                    subtitle={t`Statement of ${statementDate}`}
                    testID={InzhurSelector.ImportPage}
                    footer={<PillButtonFooter label={t`Done`} testID={InzhurSelector.DoneButton} onPress={handleDone} />}
                >
                    <InzhurImportSummary summary={summary} />
                </CollapsibleChromePage>
            </GroupedSurface>
        );
    }

    return (
        <GroupedSurface>
            <CollapsibleChromePage
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
                <View className="gap-y-3xl pt-md">
                    <Text className="px-3xl text-[15px] leading-[20px] text-secondary-foreground">
                        <Trans>
                            Budgie reads your Inzhur account statement, updates certificates and cash, and records buys and dividends for
                            you.
                        </Trans>
                    </Text>
                    <NumberedSteps title={t`How to export`} steps={exportSteps} />
                </View>
            </CollapsibleChromePage>
        </GroupedSurface>
    );
};
