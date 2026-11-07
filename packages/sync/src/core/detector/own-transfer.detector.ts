import { LanguageEnum } from '@budgie/contracts';

import type { AccountEntityInterface } from '@budgie/contracts';

class OwnTransferDetector {
    private static readonly PHRASES: Record<LanguageEnum, readonly string[]> = {
        [LanguageEnum.EN]: ['own card', 'own account', 'my card', 'my account', 'deposit opening', 'deposit closing'],
        [LanguageEnum.FR]: ['ma carte', 'mon compte', 'propre compte', 'ouverture de dépôt', 'clôture de dépôt'],
        [LanguageEnum.UK]: [
            'своєї картки',
            'свою картку',
            'мою картку',
            'свого рахунку',
            'свій рахунок',
            'відкриття депозиту',
            'закриття депозиту'
        ],
        [LanguageEnum.DE]: ['eigene karte', 'eigenes konto', 'eigenen konto', 'mein konto', 'festgeld eröffnung', 'festgeld auflösung'],
        [LanguageEnum.ES]: ['mi tarjeta', 'mi cuenta', 'cuenta propia', 'apertura de depósito', 'cierre de depósito']
    };

    private static readonly LATIN = new Map<string, string>([
        ['а', 'a'],
        ['б', 'b'],
        ['в', 'v'],
        ['г', 'h'],
        ['ґ', 'g'],
        ['д', 'd'],
        ['е', 'e'],
        ['є', 'ye'],
        ['ж', 'zh'],
        ['з', 'z'],
        ['и', 'y'],
        ['і', 'i'],
        ['ї', 'yi'],
        ['й', 'i'],
        ['к', 'k'],
        ['л', 'l'],
        ['м', 'm'],
        ['н', 'n'],
        ['о', 'o'],
        ['п', 'p'],
        ['р', 'r'],
        ['с', 's'],
        ['т', 't'],
        ['у', 'u'],
        ['ф', 'f'],
        ['х', 'kh'],
        ['ц', 'ts'],
        ['ч', 'ch'],
        ['ш', 'sh'],
        ['щ', 'shch'],
        ['ь', ''],
        ['ю', 'yu'],
        ['я', 'ya']
    ]);

    matchesAccount(title: string, account: Pick<AccountEntityInterface, 'externalId' | 'iban' | 'title'>): boolean {
        return this.cardSuffixes(title).some(suffix =>
            [account.externalId, account.iban, account.title].some(value => value?.replaceAll(/\s/gu, '').endsWith(suffix))
        );
    }

    matches(title: string, names: readonly string[]): boolean {
        const normalized = this.normalize(title);

        return (
            Object.values(OwnTransferDetector.PHRASES)
                .flat()
                .some(phrase => normalized.includes(this.normalize(phrase))) || names.some(name => this.matchesName(title, name))
        );
    }

    private cardSuffixes(title: string): string[] {
        return [...title.matchAll(/[*•●xх]+\s*(\d{4})(?!\d)/giu)].map(match => match[1]);
    }

    private matchesName(title: string, name: string): boolean {
        const words = this.normalize(name).split(' ').filter(Boolean);
        const normalized = this.normalize(title.replace(/^[\p{L}\p{N}]+\s*\*/u, ''));
        const titleWords = normalized.split(' ');

        return (
            words.length >= 2 &&
            ((titleWords.length >= 2 && titleWords.length <= words.length && titleWords.every(word => words.includes(word))) ||
                (titleWords.length === 2 &&
                    words.includes(titleWords[0]) &&
                    /\p{L}\.$/u.test(title.trim()) &&
                    words.some(word => word !== titleWords[0] && word.startsWith(titleWords[1]))))
        );
    }

    private normalize(value: string): string {
        return value
            .toLowerCase()
            .replaceAll(/[а-яіїєґ]/gu, letter => OwnTransferDetector.LATIN.get(letter) ?? letter)
            .normalize('NFD')
            .replaceAll(/\p{M}/gu, '')
            .replaceAll(/[^\p{L}\p{N}]+/gu, ' ')
            .trim();
    }
}

export const ownTransferDetector = new OwnTransferDetector();
