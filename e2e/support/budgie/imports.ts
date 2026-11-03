import { expect, type Locator } from 'e2e';

import { byId, byText, expectId, expectNoId, openLink, scrollTo, sleep, tapId, tapUntil, type Ctx } from './core.ts';
import { navigateToTransactions } from './transactions.ts';

/** subflows/import/import-test-transactions: the CSV `name` (no extension) from `E2E_CSV_FIXTURES_URI`, imported with the preset the screen detects. */
export async function importTestTransactions(ctx: Ctx, csvFixturesUri: string, name: string, expectedLabelId?: string): Promise<void> {
    await openLink(ctx, `budgie://import-csv?fileUri=${csvFixturesUri}/${name}.csv`);
    await expectId(ctx, 'ImportPresetPickerSelector.Toggle', 10_000);
    await expectId(ctx, 'CsvPage.StartImportButton.Label', 10_000);
    await expect(byText(ctx.screen, /^Import [0-9]+ transactions?$/)).toBeVisible();
    await tapUntil(ctx, 'CsvPage.StartImportButton.Label', () => expectNoId(ctx, 'ImportPresetPickerSelector.Toggle', 60_000));
    await navigateToTransactions(ctx);
    if (expectedLabelId !== undefined) {
        await expectId(ctx, expectedLabelId, 30_000);
    }
}

/**
 * A picker row's identifier: the file name, with the extension or not
 * (`e2e-budgie-import`, `16.db`), or Maestro's `name, ext` form, which the
 * iOS 26.5 simulators report. The flows' `name(, ext)?`.
 */
function fileRowId(name: string): RegExp {
    const [base, ext] = name.split(', ');
    return new RegExp(`^${quote(base!)}${ext === undefined ? '' : `((\\.|, )${quote(ext)})?`}$`);
}

const quote = (value: string): string => value.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&');

/** A folder list item: `E2EFixtures`, or `E2EFixtures, Folder` / `budgie (E2E), Container` on the iOS 26.5 simulators. */
const folderId = (name: string): RegExp => new RegExp(`^${quote(name)}(, (Folder|Container))?$`);

/**
 * subflows/import/open-e2e-fixtures-full-path: from wherever the picker's
 * Browse tab opened (it remembers the last folder, or shows its Locations
 * list), walk to On My iPhone → budgie (E2E) → E2EFixtures, going back up
 * when it is elsewhere.
 */
async function openE2EFixturesFullPath(ctx: Ctx, row: Locator): Promise<void> {
    const { screen } = ctx;
    const item = (name: string) => screen.getByTestId(folderId(name)).first();
    const inside = (title: string) => screen.getByTestId(new RegExp(`Title: ${quote(title)}$`)).first();
    for (let step = 0; step < 6; step++) {
        if (await row.isVisible()) {
            return;
        }
        if (await inside('E2EFixtures').isVisible()) {
            return;
        }
        if (await byText(screen, /could not be displayed/).isVisible()) {
            await screen.getByRole('button', { name: 'Try Again' }).first().tap();
            await sleep(800);
            continue;
        }
        const fixtures = item('E2EFixtures');
        if (await fixtures.isVisible()) {
            await fixtures.tap();
            await expect(inside('E2EFixtures')).toBeVisible({ timeout: 8_000 });
            return;
        }
        const container = item('budgie (E2E)');
        if (await container.isVisible()) {
            await container.tap();
            await expect(item('E2EFixtures')).toBeVisible({ timeout: 8_000 });
            continue;
        }
        const onMyPhone = screen.getByTestId(/^(On My iPhone|DOC\.sidebar\.item\.On My iPhone)$/).first();
        if (await onMyPhone.isVisible()) {
            await onMyPhone.tap();
            await sleep(800);
            continue;
        }
        const back = byId(screen, 'BackButton');
        if (!(await back.isVisible())) {
            break;
        }
        await back.tap();
        await sleep(800);
    }
    throw new Error('document picker: could not reach budgie (E2E)/E2EFixtures');
}

/**
 * centerElement: a row drawn under the translucent tab bar or search header
 * reads as visible but takes no tap (one under the header lands on the
 * sheet's chrome). Drags the list by the row's offset from the middle; with
 * the row above the middle the list is not at its top, so the drag down
 * cannot pull the sheet closed.
 */
async function centerPickerRow(ctx: Ctx, row: Locator, x: number, top: number, bottom: number): Promise<void> {
    const box = await row.boundingBox();
    if (box === null) {
        throw new Error('document picker: the row has no bounds');
    }
    const middle = (top + bottom) / 2;
    const shift = box.y + box.height / 2 - middle;
    if (Math.abs(shift) < 120) {
        return;
    }
    const half = Math.min(Math.abs(shift), bottom - top - 40) / 2;
    const [from, to] = shift > 0 ? [middle + half, middle - half] : [middle - half, middle + half];
    await ctx.screen.swipe({ from: { x, y: from }, to: { x, y: to }, duration: 600 });
}

/**
 * Pages the picker's file list down until `row` shows, then centres it. Each
 * page drags between the navigation bar and the tab bar: a swipe from the
 * list's centre can land on the tab bar (the list runs under it). It never
 * drags down: at the top of the list that pulls the whole picker sheet
 * closed. A list the picker reopened scrolled past `row` is reset by going
 * up a folder and back into it.
 */
async function scrollPickerTo(ctx: Ctx, row: Locator): Promise<void> {
    const { screen } = ctx;
    const picker = byId(screen, 'DOC.browsingModeTabBar');
    const nav = await byId(screen, 'FullDocumentManagerViewControllerNavigationBar').boundingBox();
    const tabs = await picker.boundingBox();
    if (nav === null || tabs === null) {
        throw new Error('document picker: no navigation bar or tab bar bounds');
    }
    const x = nav.x + nav.width / 2;
    const top = nav.y + nav.height + 60;
    const bottom = tabs.y - 60;
    const page = async () => {
        for (let n = 0; n < 12; n++) {
            if (await row.isVisible()) {
                return true;
            }
            if (!(await picker.isVisible())) {
                throw new Error('document picker: closed while paging');
            }
            await screen.swipe({ from: { x, y: bottom }, to: { x, y: top }, duration: 400 });
            await sleep(400);
        }
        return row.isVisible();
    };
    if (!(await page())) {
        await byId(screen, 'BackButton').tap();
        await openE2EFixturesFullPath(ctx, row);
        await page();
    }
    await expect(row).toBeVisible({ timeout: 1_000 });
    await centerPickerRow(ctx, row, x, top, bottom);
    // A tap on a list still decelerating only stops it.
    await sleep(1_000);
}

/**
 * subflows/import/select-file-from-app-provider: in the open document
 * picker, Browse to the app's E2EFixtures folder and pick `name`
 * (`erste-statement-008, pdf`). The picker is system UI, but it renders in
 * the app's own tree: tabs are buttons, folders and files list items whose
 * id is their name.
 */
export async function selectFileFromAppProvider(ctx: Ctx, name: string): Promise<void> {
    const { screen } = ctx;
    const cancel = screen.getByRole('button', { name: 'Cancel' }).first();
    await expect(cancel).toBeVisible({ timeout: 15_000 });
    if (await byText(screen, 'Apple Account Verification').isVisible()) {
        await screen.getByText('Not Now').last().tap();
    }
    const picker = byId(screen, 'DOC.browsingModeTabBar');
    // The picker reopens where it was left; tapping an already selected Browse tab would pop to its root.
    if (!(await byId(screen, 'Browse View (Picker)').isVisible())) {
        await picker
            .getByRole('button', { name: 'Browse' })
            .or(picker.getByRole('tab', { name: 'Browse' }))
            .first()
            .tap();
        await sleep(800);
    }
    const row = screen.getByTestId(fileRowId(name)).first();
    await openE2EFixturesFullPath(ctx, row);
    await scrollPickerTo(ctx, row);
    await row.tap();
    try {
        await expect(picker).toBeHidden({ timeout: 5_000 });
    } catch {
        const open = screen.getByRole('button', { name: /^(Open|Continue)$/ }).first();
        if (await open.isVisible()) {
            await open.tap();
        } else {
            await row.tap();
        }
        await expect(picker).toBeHidden({ timeout: 5_000 });
    }
}

/** subflows/import/open-csv-import-picker */
export async function openCsvImportPicker(ctx: Ctx): Promise<void> {
    await openLink(ctx, 'budgie://settings/data');
    await expectId(ctx, 'DataPage.Container', 15_000);
    await scrollTo(ctx, 'CsvPage.ImportCard');
    await sleep(400);
    await tapUntil(ctx, 'CsvPage.ImportCard', () => expect(byText(ctx.screen, 'Cancel')).toBeVisible({ timeout: 15_000 }));
}

/** subflows/import/import-erste-pdf-from-picker / import-privatbank-xlsx-from-picker: the file-bank create flow from the file picker to home. */
export async function importStatementFromPicker(
    ctx: Ctx,
    file: string,
    accountRowId: string,
    between?: () => Promise<void>
): Promise<void> {
    await expectId(ctx, 'CreateFileBankAccount.SelectFileButton', 10_000);
    await tapUntil(ctx, 'CreateFileBankAccount.SelectFileButton', () =>
        expect(byText(ctx.screen, 'Cancel')).toBeVisible({ timeout: 15_000 })
    );
    await selectFileFromAppProvider(ctx, file);
    await expectId(ctx, accountRowId, 5_000);
    if (between === undefined) {
        await tapId(ctx, accountRowId);
    } else {
        await between();
    }
    await expectId(ctx, 'CreateFileBankAccount.StartSyncButton', 15_000);
    await tapUntil(ctx, 'CreateFileBankAccount.StartSyncButton', () => expectId(ctx, 'CreateFileBankAccount.ImportButton', 15_000));
    await tapId(ctx, 'CreateFileBankAccount.ImportButton');
    await sleep(800);
    if (await byText(ctx.screen, 'Already syncing').isVisible()) {
        await tapId(ctx, 'PageHeader.BackButton');
    }
    await expectId(ctx, 'HomePage.TotalBalance', 60_000);
}
