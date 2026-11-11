import * as a from '../support/budgie/accounts.ts';
import * as c from '../support/budgie/categories.ts';
import * as b from '../support/budgie/core.ts';
import * as m from '../support/budgie/misc.ts';
import { PENDING_ANDROID_PORT, test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

test('05 category', { tags: ['categories'], platforms: PENDING_ANDROID_PORT }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const id = (testId: string) => b.byId(screen, testId);
    const nameAndSubmit = async (name: string, clear = false) => {
        const input = id('CategoryForm.Input');
        await input.tap();
        if (clear) {
            await input.clear();
        }
        await input.fill(name);
        try {
            await input.press('Enter');
        } catch (cause) {
            // A press the device does not acknowledge in time has usually been delivered; the form's state is checked next.
            console.log(`[retry] Enter on the name field: ${(cause as Error).message.split('\n')[0]}`);
        }
        await b.tapId(ctx, 'CategoryForm.Submit');
    };
    const newCategory = async (query: string, icon: string, name: string) => {
        await b.tapId(ctx, 'ActionButton');
        await b.tapText(ctx, 'Category');
        await c.openIconPicker(ctx);
        await c.pickIconFromOpenPicker(ctx, query, icon);
        await nameAndSubmit(name);
        await b.expectId(ctx, `CategoryCard.${name}`);
        await b.expectId(ctx, `CategoryCard.Icon.${name}.${icon}`);
    };

    await budgie.start({ fixture: '05.db' });
    await b.phase('open categories', async () => {
        await a.navigateToSettings(ctx);
        await a.openSettingsCard(ctx, 'SettingsPage.ManageCategoriesCard', 'CategoryPage.SearchInput');
    });

    await b.phase('create primary category with icon', () => newCategory('bike', 'reicon:Bicycle', 'E2E Category Primary'));
    await b.phase('create second category for search', () => newCategory('home', 'reicon:Home', 'E2E Category Search'));

    await b.phase('search and open result', async () => {
        await b.fillId(ctx, 'CategoryPage.SearchInput', 'Search');
        await b.expectId(ctx, 'CategoryCard.E2E Category Search');
        await b.expectNoId(ctx, 'CategoryCard.E2E Category Primary');
        await b.tapId(ctx, 'CategoryCard.E2E Category Search');
        await b.expectText(ctx, /^E2E Category Search/i);
        await b.tapId(ctx, 'CategoryForm.Delete');
        await b.alertButton(screen, 'Delete').tap();
        await b.expectNoId(ctx, 'CategoryForm.Delete', 10_000);
        await b.expectNoId(ctx, 'CategoryCard.E2E Category Search');
        await id('CategoryPage.SearchInput').clear();
        await b.expectId(ctx, 'CategoryCard.E2E Category Primary');
        await b.expectNoId(ctx, 'CategoryCard.E2E Category Search');
    });

    await b.phase('edit primary category text + icon', async () => {
        await b.tapId(ctx, 'CategoryCard.E2E Category Primary');
        await c.openIconPicker(ctx);
        await b.expectNoId(ctx, 'CategoryForm.Input');
        await c.pickIconFromOpenPicker(ctx, 'heart', 'reicon:Heart');
        await b.expectId(ctx, 'CategoryForm.Input');
        await nameAndSubmit('E2E Category Updated', true);
        await b.expectId(ctx, 'CategoryCard.E2E Category Updated');
        await b.expectId(ctx, 'CategoryCard.Icon.E2E Category Updated.reicon:Heart');
        await b.expectNoId(ctx, 'CategoryCard.E2E Category Primary');
        await c.swipeRowToDelete(ctx, 'CategoryCard.E2E Category Updated');
        await b.alertButton(screen, 'Delete').tap();
        await b.expectNoId(ctx, 'CategoryCard.E2E Category Updated', 10_000);
    });
});

test('05 category move and delete', { tags: ['categories'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;

    await budgie.start({ fixture: '14.db' });

    await b.phase('delete a used category through move and delete', async () => {
        await a.navigateToSettings(ctx);
        await a.openSettingsCard(ctx, 'SettingsPage.ManageCategoriesCard', 'CategoryPage.SearchInput');
        await b.tapId(ctx, 'CategoryCard.E2E Filter Expense Category');
        await b.expectId(ctx, 'CategoryForm.Delete', 10_000);
        await b.tapId(ctx, 'CategoryForm.Delete');
        await b.expectSettledId(ctx, 'CategoryPickerBottomSheet.CommitButton');
        await b.fillId(ctx, 'CategoryPickerBottomSheet.Input', 'Income Category');
        await b.tapId(ctx, 'CategoryPickerBottomSheet.Card.E2E Filter Income Category');
        await b.expectText(ctx, /moves? to “E2E Filter Income Category”\. “E2E Filter Expense Category” will be deleted\./);
        await b.tapId(ctx, 'CategoryPickerBottomSheet.CommitButton');
        await b.expectNoId(ctx, 'CategoryPickerBottomSheet.CommitButton', 10_000);
        await b.expectNoId(ctx, 'CategoryCard.E2E Filter Expense Category', 10_000);
    });

    await b.phase('moved transactions carry the destination category', async () => {
        await t.navigateToTransactions(ctx);
        await m.revealChip(ctx, 'TransactionFilters.AmountChip', 'TransactionFilters.CategoryChip', 'right');
        await c.applyCategoryFilter(ctx, 'E2E Filter Income Category');
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Filter_Expense');
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Filter_Income');
    });
});
