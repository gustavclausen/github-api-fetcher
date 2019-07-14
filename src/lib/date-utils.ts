/**
 * Describes calendar month
 */
export enum Month {
    JANUARY,
    FEBRUARY,
    MARCH,
    APRIL,
    MAY,
    JUNE,
    JULY,
    AUGUST,
    SEPTEMBER,
    OCTOBER,
    NOVEMBER,
    DECEMBER
}

/**
 * Returns each month represented by its number (starting with 0 for January)
 */
export const allMonthNumbers: number[] = Object.values(Month).filter(
    (value): boolean => typeof value === 'number'
) as number[];
