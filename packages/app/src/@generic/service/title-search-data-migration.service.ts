import { isDefined } from '@rnw-community/shared';

import { accountRepository, categoryRepository, settingsRepository, tagRepository } from '../drizzle/db/db';

class TitleSearchDataMigrationService {
    async migrate(): Promise<void> {
        const settings = await settingsRepository.getSettings();

        if (settings.isTitleSearchMigrated) {
            return;
        }

        await this.migrateCategories();
        await this.migrateTags();
        await this.migrateAccounts();

        await settingsRepository.update({ isTitleSearchMigrated: true });
    }

    private async migrateCategories(): Promise<void> {
        const categories = await categoryRepository.findAll();

        await Promise.all(
            categories
                .filter(category => isDefined(category.title))
                .map(category => categoryRepository.updateById(category.id, { title: category.title }))
        );
    }

    private async migrateTags(): Promise<void> {
        const tags = await tagRepository.findAll();

        await Promise.all(
            tags.filter(tag => isDefined(tag.title)).map(tag => tagRepository.updateById(tag.id, { title: tag.title }))
        );
    }

    private async migrateAccounts(): Promise<void> {
        const accounts = await accountRepository.findAll();

        await Promise.all(
            accounts
                .filter(account => isDefined(account.title))
                .map(account => accountRepository.updateById(account.id, { title: account.title }))
        );
    }
}

export const titleSearchDataMigrationService = new TitleSearchDataMigrationService();
