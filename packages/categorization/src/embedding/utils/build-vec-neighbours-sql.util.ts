export const buildVecNeighboursSql = (vecTableName: string): string => `
    (SELECT rowid, distance, 1.0 / (squared * squared * squared * squared) AS weight
     FROM (SELECT rowid, distance, (distance + 0.01) * (distance + 0.01) AS squared
           FROM (SELECT rowid, distance FROM ${vecTableName} WHERE embedding MATCH ? ORDER BY distance LIMIT ?)))`;
