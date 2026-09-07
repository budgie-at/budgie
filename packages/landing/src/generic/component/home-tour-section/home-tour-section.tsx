import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureStory } from '../../../feature/component/feature-story/feature-story';
import { StoryDensityEnum } from '../../../feature/enum/story-density.enum';
import { getI18nInstance } from '../../../i18n/app-router-i18n';

interface Props {
    readonly locale: string;
}

// eslint-disable-next-line max-lines-per-function -- Five-step scroll story is one continuous composition
export const HomeTourSection = ({ locale }: Props) => {
    const i18n = getI18nInstance(locale);

    return (
        <FeatureStory density={StoryDensityEnum.COMPACT}>
            <FeatureStory.Intro heading={<Trans>One expense, from your thumb to your charts</Trans>}>
                <Trans>Five screens of the real app, in the order you actually meet them.</Trans>
            </FeatureStory.Intro>

            <FeatureStory.Step index={0} title={<Trans>Add it in three taps</Trans>}>
                <Trans>The keypad opens first. Type the amount, keep the account Budgie already picked, and save.</Trans>
            </FeatureStory.Step>
            <FeatureStory.Shot
                alt={t(i18n)`Budgie New Expense screen with the amount keypad open and Main Checking preselected as the account`}
                index={0}
                locale={locale}
                scene="expense-tracking-1"
                slug="expense-tracking"
            >
                <FeatureStory.Callout y={0.307}>
                    <Trans>Amount first, no form</Trans>
                </FeatureStory.Callout>
                <FeatureStory.Callout y={0.884}>
                    <Trans>Account picked for you</Trans>
                </FeatureStory.Callout>
            </FeatureStory.Shot>

            <FeatureStory.Step index={1} title={<Trans>It files itself</Trans>}>
                <Trans>
                    The merchant and its category land on the entry before you finish typing, decided by a model running on your phone.
                </Trans>
            </FeatureStory.Step>
            <FeatureStory.Shot
                alt={t(i18n)`Budgie Edit Expense screen showing the Silpo merchant recognised and the Groceries category already filled in`}
                index={1}
                locale={locale}
                scene="mcc-auto-category-1"
                slug="mcc-auto-category"
            >
                <FeatureStory.Callout y={0.404}>
                    <Trans>Merchant recognised locally</Trans>
                </FeatureStory.Callout>
                <FeatureStory.Callout y={0.507}>
                    <Trans>Category chosen on device</Trans>
                </FeatureStory.Callout>
            </FeatureStory.Shot>

            <FeatureStory.Step index={2} title={<Trans>Your bank, with nobody in between</Trans>}>
                <Trans>Monobank cards and jars arrive through your own token, straight into the database on your phone.</Trans>
            </FeatureStory.Step>
            <FeatureStory.Clip
                alt={t(i18n)`Screen recording of the Monobank group on the Budgie home screen opening its synced accounts`}
                index={2}
                locale={locale}
                scene="monobank-sync-clip-1"
                slug="monobank-sync"
            />

            <FeatureStory.Step index={3} title={<Trans>See where it actually goes</Trans>}>
                <Trans>Spending by category and by tag, for any period, and every slice opens the transactions underneath it.</Trans>
            </FeatureStory.Step>
            <FeatureStory.Clip
                alt={t(i18n)`Screen recording of Budgie analytics filtering spending by category and drilling into a period`}
                index={3}
                locale={locale}
                scene="spending-analytics-clip-1"
                slug="spending-analytics"
            />

            <FeatureStory.Step index={4} title={<Trans>Works with the radio off</Trans>}>
                <Trans>
                    Everything above runs from a database on the device. Aeroplane mode changes nothing about what you can see or do.
                </Trans>
            </FeatureStory.Step>
            <FeatureStory.Shot
                alt={t(i18n)`Budgie transactions list showing 81 transactions loaded with no network request in flight`}
                index={4}
                locale={locale}
                scene="offline-first-expense-tracker-1"
                slug="offline-first-expense-tracker"
            >
                <FeatureStory.Callout y={0.205}>
                    <Trans>81 transactions, no request</Trans>
                </FeatureStory.Callout>
                <FeatureStory.Callout y={0.45}>
                    <Trans>The whole list, no spinner</Trans>
                </FeatureStory.Callout>
            </FeatureStory.Shot>
        </FeatureStory>
    );
};
