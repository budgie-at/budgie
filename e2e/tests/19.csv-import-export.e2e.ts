// Port of tests/app-tests/flows/19.csv-import-export.flow.yaml.
import * as a from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import * as i from '../support/budgie/imports.ts';
import * as sec from '../support/budgie/security.ts';
import * as s from '../support/budgie/settings.ts';
import { test } from '../support/budgie/test.ts';

test('19 csv import export', { tags: ['import'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const importCsv = async () => {
        await i.openCsvImportPicker(ctx);
        await i.selectFileFromAppProvider(ctx, 'e2e-budgie-import, csv');
        await b.expectId(ctx, 'ImportPresetPickerSelector.Toggle', 15_000);
        await b.tapId(ctx, 'ImportPresetPickerSelector.Toggle');
        await b.tapId(ctx, 'ImportScreen.PresetChip.Budgie');
        await b.expectText(ctx, /^Import \d+ transactions?$/);
        await b.tapId(ctx, 'CsvPage.StartImportButton');
        await b.expectNoId(ctx, 'ImportPresetPickerSelector.Toggle', 60_000);
        await b.tapId(ctx, 'TabBar.Home');
        await b.expectId(ctx, 'HomePage.NetWorthValue.78', 10_000);
        await a.openAccountDetails(ctx, 'e2e csv wallet USD');
    };

    await budgie.start({ fixture: '19.db' });

    await b.phase('import csv', async () => {
        await importCsv();
        await b.scrollTo(ctx, 'TransactionCard.Label.E2E_CSV_MCC_Grocery');
        await b.expectId(ctx, 'TransactionCard.Category.Groceries', 3_000);
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'TabBar.Home', 10_000);
    });

    await b.phase('export csv', async () => {
        await b.openLink(ctx, 'budgie://settings/data');
        await b.expectId(ctx, 'DataPage.Container', 15_000);
        await b.scrollTo(ctx, 'CsvPage.ExportCard');
        await b.sleep(400);
        await b.tapUntil(ctx, 'CsvPage.ExportCard', () => b.expectText(ctx, 'Save to Files', 15_000));
        await sec.dismissSaveToFilesSheet(ctx);
        await b.expectId(ctx, 'DataPage.Container', 5_000);
        if (await b.byText(screen, 'Convert past amounts?').isVisible()) {
            await screen.getByText('Cancel').last().tap();
        }
        await s.goHome(ctx);
    });

    await b.phase('re-import, fallback category', async () => {
        await importCsv();
        await b.expectId(ctx, 'UncategorizedTransactionsPill.Button');
        await b.scrollTo(ctx, 'TransactionCard.Label.E2E_CSV_MCC_Grocery');
        await b.expectNoId(ctx, 'TransactionCard.Category.Other');
    });
});
