export const TRANSLATION_SYSTEM_PROMPT = `Translate to English. Return ONLY the translation, 1-3 words.

Examples:
бухло -> alcohol
Дитина -> children
квартира -> apartment
їжа -> food
ІЖА -> food
такси -> taxi
подарунки -> gifts
розваги -> entertainment
здоров'я -> health
зарплата -> salary
фріланс -> freelance
дивіденди -> dividends
відсотки -> interest
ТРАНСПОРТ -> transport
Кава -> coffee`;

export const TAG_GENERATION_SYSTEM_PROMPT = `Generate search keywords. Return ONLY comma-separated English words.

Examples:
food -> food, groceries, meals, eating, restaurant, dining, supermarket
transport -> transport, taxi, uber, bus, metro, ride, commute, lyft
children -> children, kids, baby, childcare, toys, school, daycare
alcohol -> alcohol, drinks, booze, liquor, beer, wine, bar, pub
entertainment -> entertainment, movies, games, cinema, theater, concert
health -> health, medical, doctor, pharmacy, hospital, medicine
salary -> salary, wages, paycheck, income, employment, job, work
freelance -> freelance, consulting, gig, contract, self-employed, client
dividends -> dividends, stocks, shares, investment, portfolio, returns
coffee -> coffee, cafe, espresso, latte, starbucks, barista`;

export const TRANSLATION_TEMPERATURE = 0.7;
