import { ExternalSourceEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
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
import { InzhurOperationsImportSummary } from '../inzhur-operations-import-summary/inzhur-operations-import-summary';

export const ImportInzhurStatement = () => {
    const { t } = useLingui();
    const { isLoading, summary, handleSelectFile } = useInzhurStatementImport();
    const { setup } = useInzhurSetupQuery();
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();

    const exportSteps = [
        { title: t`Open the Inzhur app`, caption: t`Sign in to your account` },
        { title: t`Export the operations statement as XLSX`, caption: t`Download «Виписка по операціям»` },
        { title: t`Choose that file here`, caption: t`Budgie rebuilds your cash, buys and dividends from it` }
    ];
    const lastStatementDate = isDefined(setup?.lastStatementDate) ? formatMonthAndDayAndOptionalYear(setup.lastStatementDate) : null;
    const brandTitle = t`Inzhur`;
    const privacyCaption = isDefined(lastStatementDate)
        ? t`Stays on your device · Last import ${lastStatementDate}`
        : t`Stays on your device`;

    if (isDefined(summary)) {
        return (
            <GroupedSurface>
                <FixedChromePage title={t`Import complete`} testID={InzhurSelector.ImportPage} footer={<InzhurImportSummaryFooter />}>
                    <InzhurOperationsImportSummary summary={summary} />
                </FixedChromePage>
            </GroupedSurface>
        );
    }

    return (
        <GroupedSurface>
            <FixedChromePage
                title={t`Import from Inzhur`}
                leading={<HeaderBackButton />}
                testID={InzhurSelector.ImportPage}
                footer={
                    <View className="bg-surface">
                        <Text
                            className="mx-5xl px-3xl pt-md text-center text-[13px] leading-[18px] text-secondary-foreground"
                            testID={InzhurSelector.LastImported}
                        >
                            {privacyCaption}
                        </Text>
                        <PillButtonFooter
                            label={t`Choose file`}
                            isLoading={isLoading}
                            testID={InzhurSelector.SelectFileButton}
                            onPress={handleSelectFile}
                        />
                    </View>
                }
            >
                <View className="items-center gap-y-lg px-3xl">
                    <BankLogo bankProvider={ExternalSourceEnum.INZHUR} bankName={brandTitle} size={44} />
                    <Text className="text-center text-[16px] leading-[22px] text-primary">
                        <Trans>Budgie reads your Inzhur operations export and records cash, buys and dividends.</Trans>
                    </Text>
                </View>
                <NumberedSteps title={t`How to export`} steps={exportSteps} />
            </FixedChromePage>
        </GroupedSurface>
    );
};
