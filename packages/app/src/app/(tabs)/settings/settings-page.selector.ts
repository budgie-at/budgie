import { isDefined } from '@rnw-community/shared';

import type { AccountEntityInterface } from '@budgie/contracts';

const normalizePart = (value: number | string) => String(value).replace(/[^a-zA-Z0-9]+/gu, '_');

export const SettingsPageSelector = {
    Container: 'SettingsPage.Container',
    AppLockCard: 'SettingsPage.AppLockCard',
    AppLockChangePinButton: 'SettingsPage.AppLockChangePinButton',
    AppLockDisableButton: 'SettingsPage.AppLockDisableButton',
    AppLockBiometricSwitch: 'SettingsPage.AppLockBiometricSwitch',
    ScreenshotProtectionCard: 'SettingsPage.ScreenshotProtectionCard',
    ScreenshotProtectionSwitch: 'SettingsPage.ScreenshotProtectionSwitch',
    LanguageCard: (code: string) => `SettingsPage.LanguageCard.${normalizePart(code)}` as const,
    MainCurrencyCard: (code: string) => `SettingsPage.MainCurrencyCard.${normalizePart(code)}` as const,
    DefaultAccountCard: (account: Pick<AccountEntityInterface, 'id' | 'title'> | null) =>
        isDefined(account)
            ? (`SettingsPage.DefaultAccountCard.Selected.${normalizePart(account.id)}.${normalizePart(account.title)}` as const)
            : ('SettingsPage.DefaultAccountCard.None' as const),
    ApplePayCaptureCard: 'SettingsPage.ApplePayCaptureCard',
    DarkModeCard: 'SettingsPage.DarkModeCard',
    DarkModeSwitch: 'SettingsPage.DarkModeSwitch',
    ShowCentsCard: 'SettingsPage.ShowCentsCard',
    ShowCentsSwitch: 'SettingsPage.ShowCentsSwitch',
    ManageCategoriesCard: 'SettingsPage.ManageCategoriesCard',
    ManageTagsCard: 'SettingsPage.ManageTagsCard',
    ArchivedCard: 'SettingsPage.ArchivedCard',
    InactiveCard: 'SettingsPage.InactiveCard',
    ImportDatabaseCard: 'SettingsPage.ImportDatabaseCard',
    ExportDatabaseCard: 'SettingsPage.ExportDatabaseCard',
    ClearDataCard: 'SettingsPage.ClearDataCard',
    ManageRulesCard: 'SettingsPage.ManageRulesCard',
    BudgetManagementCard: 'SettingsPage.BudgetManagementCard',
    BudgetWidgetCard: 'SettingsPage.BudgetWidgetCard',
    BudgetWidgetSwitch: 'SettingsPage.BudgetWidgetSwitch',
    BudgetWidgetSwitchStateOn: 'SettingsPage.BudgetWidgetSwitch.State.On',
    BudgetWidgetSwitchStateOff: 'SettingsPage.BudgetWidgetSwitch.State.Off',
    BudgetPushCard: 'SettingsPage.BudgetPushCard',
    BudgetPushSwitch: 'SettingsPage.BudgetPushSwitch',
    BudgetPushSwitchStateOn: 'SettingsPage.BudgetPushSwitch.State.On',
    BudgetPushSwitchStateOff: 'SettingsPage.BudgetPushSwitch.State.Off',
    ConsolidateTransfersCard: 'SettingsPage.ConsolidateTransfersCard',
    RecalculateBalancesCard: 'SettingsPage.RecalculateBalancesCard',
    MoneyDataUpgradeCard: 'SettingsPage.MoneyDataUpgradeCard',
    RepairSyncDataCard: 'SettingsPage.RepairSyncDataCard',
    ReportBugCard: 'SettingsPage.ReportBugCard'
} as const;
