import { ExternalSourceEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { FixedChromePage } from '../../../@generic/component/fixed-chrome-page/fixed-chrome-page';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { InstitutionMark } from '../../../account/component/institution-mark/institution-mark';
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
        { title: t`Open the Inzhur app`, caption: t`Sign in to your account` },
        { title: t`Download your account statement`, caption: t`«Виписка про стан рахунку» · PDF` }
    ];
    const lastStatementDate = isDefined(setup?.lastStatementDate) ? formatMonthAndDayAndOptionalYear(setup.lastStatementDate) : null;
    const brandTitle = t`Inzhur`;
    const privacyCaption = isDefined(lastStatementDate)
        ? t`Stays on your device · Last import ${lastStatementDate}`
        : t`Read on your device. Nothing is uploaded.`;

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
            <FixedChromePage title={t`Import statement`} leading={<HeaderBackButton />} testID={InzhurSelector.ImportPage}>
                <View className="items-center gap-y-lg">
                    <InstitutionMark provider={ExternalSourceEnum.INZHUR} title={brandTitle} />
                    <Text className="px-3xl text-center text-[15px] leading-[20px] text-secondary-foreground">
                        <Trans>Budgie reads your Inzhur statement and updates certificates, cash, buys and dividends.</Trans>
                    </Text>
                </View>
                <View className="gap-y-md">
                    <NumberedSteps title={t`How to export`} steps={exportSteps} />
                    <Text className="px-3xl text-[13px] leading-[18px] text-secondary-foreground" testID={InzhurSelector.LastImported}>
                        {privacyCaption}
                    </Text>
                </View>
                <View className="px-3xl">
                    <PillButton
                        label={t`Choose PDF statement`}
                        isLoading={isLoading}
                        testID={InzhurSelector.SelectFileButton}
                        onPress={handleSelectFile}
                    />
                </View>
            </FixedChromePage>
        </GroupedSurface>
    );
};
