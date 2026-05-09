import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { utils, writeFile } from 'xlsx';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const fixtureDirectory = join(scriptDirectory, '..', 'fixtures', 'privatbank');
const card = '4149 0000 0000 1234';

const headerRows = [
    [
        'Date',
        'Category',
        'Card',
        'Description',
        'Card Amount',
        'Card Currency',
        'Operation Amount',
        'Operation Currency',
        'End Balance',
        'Balance Currency'
    ],
    ['', '', '', '', '', '', '', '', '', '']
];

const firstStatementRows = [
    ['10.04.2026 10:15:00', 'Groceries', card, 'E2E Privatbank Market', -150, 'UAH', -150, 'UAH', 850, 'UAH'],
    ['11.04.2026 09:30:00', 'Salary', card, 'E2E Privatbank Salary', 1200, 'UAH', 1200, 'UAH', 2050, 'UAH']
];

const secondStatementRows = [
    ...firstStatementRows,
    ['12.04.2026 08:45:00', 'Restaurants', card, 'E2E Privatbank Coffee', -200, 'UAH', -200, 'UAH', 1850, 'UAH']
];

const writeStatement = (fileName, rows) => {
    const workbook = utils.book_new();
    const worksheet = utils.aoa_to_sheet([...headerRows, ...rows]);

    utils.book_append_sheet(workbook, worksheet, 'Statement');
    writeFile(workbook, join(fixtureDirectory, fileName), { compression: true });
};

mkdirSync(fixtureDirectory, { recursive: true });
writeStatement('privatbank-statement-001.xlsx', firstStatementRows);
writeStatement('privatbank-statement-002.xlsx', secondStatementRows);
