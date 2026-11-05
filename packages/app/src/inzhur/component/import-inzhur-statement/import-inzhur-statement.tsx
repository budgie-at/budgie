import { ExternalSourceEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { FixedChromePage } from '../../../@generic/component/fixed-chrome-page/fixed-chrome-page';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { PillButtonFooter } from '../../../@generic/component/pill-button-footer/pill-button-footer';
import { InstitutionMark } from '../../../account/component/institution-mark/institution-mark';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { NumberedSteps } from '../../../sync/component/numbered-steps/numbered-steps';
import { useInzhurStatementImport } from '../../hook/use-inzhur-statement-import.hook';
import { useInzhurSetupQuery } from '../../query/use-inzhur-setup.query';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurImportSummaryFooter } from '../inzhur-import-summary-footer/inzhur-import-summary-footer';
import { InzhurImportSummary } from '../inzhur-import-summary/inzhur-import-summary';
import { InzhurLinkedPaymentsLine } from '../inzhur-linked-payments-line/inzhur-linked-payments-line';
import { InzhurOperationsImportSummary } from '../inzhur-operations-import-summary/inzhur-operations-import-summary';

export const ImportInzhurStatement = () => {
    const { t } = useLingui();
    const { isLoading, summary, operationsSummary, handleSelectFile } = useInzhurStatementImport();
    const { setup } = useInzhurSetupQuery();
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();

    const exportSteps = [
        { title: t`Open the Inzhur app`, caption: t`Sign in to your account` },
        {
            title: t`Operations (XLSX), recommended`,
            caption: t`Download «Виписка по операціям». Budgie rebuilds your cash, buys and dividends from it.`
        },
        { title: t`Holdings (PDF), optional`, caption: t`Download «Виписка про стан рахунку». It confirms how many certificates you hold.` }
    ];
    const lastStatementDate = isDefined(setup?.lastStatementDate) ? formatMonthAndDayAndOptionalYear(setup.lastStatementDate) : null;
    const brandTitle = t`Inzhur`;
    const privacyCaption = isDefined(lastStatementDate)
        ? t`Stays on your device · Last import ${lastStatementDate}`
        : t`Read on your device. Nothing is uploaded.`;

    if (isDefined(operationsSummary)) {
        return (
            <GroupedSurface>
                <FixedChromePage title={t`Statement imported`} testID={InzhurSelector.ImportPage} footer={<InzhurImportSummaryFooter />}>
                    <InzhurOperationsImportSummary summary={operationsSummary} />
                </FixedChromePage>
            </GroupedSurface>
        );
    }

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
                    <View className="bg-surface">
                        <Text
                            className="mx-5xl px-3xl pt-md text-center text-[13px] leading-[18px] text-secondary-foreground"
                            testID={InzhurSelector.LastImported}
                        >
                            {privacyCaption}
                        </Text>
                        <PillButtonFooter
                            label={t`Choose statement`}
                            isLoading={isLoading}
                            testID={InzhurSelector.SelectFileButton}
                            onPress={handleSelectFile}
                        />
                    </View>
                }
            >
                <View className="items-center gap-y-lg px-3xl">
                    <InstitutionMark provider={ExternalSourceEnum.INZHUR} title={brandTitle} />
                    <Text className="text-center text-[16px] leading-[22px] text-primary">
                        <Trans>Budgie reads your Inzhur statement and updates certificates, cash, buys and dividends.</Trans>
                    </Text>
                </View>
                <NumberedSteps title={t`How to export`} steps={exportSteps} />
                <InzhurLinkedPaymentsLine />
            </FixedChromePage>
        </GroupedSurface>
    );
};
