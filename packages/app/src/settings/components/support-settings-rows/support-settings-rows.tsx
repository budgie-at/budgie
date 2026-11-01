import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Linking } from 'react-native';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { openGithubIssueCreation } from '../../../@generic/utils/open-github-issue-creation.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { SettingsRowAccessoryKindEnum } from '../../enum/settings-row-accessory-kind.enum';
import { SettingsRowAccessory } from '../settings-row-accessory/settings-row-accessory';
import { SettingsRow } from '../settings-row/settings-row';

const CHANGELOG_URL = 'https://budgie.at/changelog';
const PRIVACY_URL = 'https://budgie.at/privacy';

export const SupportSettingsRows = () => {
    const { t } = useLingui();

    const openLink = (link: Effect.Effect<unknown>) =>
        void appRuntime.runFork(logAndContinue(link.pipe(toastOnFailure(t`Could not open the link`))));
    const handleOpenChangelog = () => void openLink(Effect.promise(() => Linking.openURL(CHANGELOG_URL)));
    const handleOpenPrivacy = () => void openLink(Effect.promise(() => Linking.openURL(PRIVACY_URL)));
    const handleReportBug = () => void openLink(openGithubIssueCreation);
    const externalAccessory = <SettingsRowAccessory kind={SettingsRowAccessoryKindEnum.EXTERNAL} />;

    return (
        <>
            <SettingsRow
                onPress={handleOpenChangelog}
                title={t`What's new`}
                icon={UserIconNameEnum.Sparkles}
                variant="ghost"
                right={externalAccessory}
            />
            <SettingsRow
                onPress={handleReportBug}
                title={t`Report a bug or idea`}
                icon={UserIconNameEnum.Bug}
                variant="ghost"
                right={externalAccessory}
                testID={SettingsPageSelector.ReportBugCard}
            />
            <SettingsRow
                onPress={handleOpenPrivacy}
                title={t`Privacy policy`}
                icon={UserIconNameEnum.ShieldCheck}
                variant="ghost"
                right={externalAccessory}
            />
        </>
    );
};
