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

export const allMonthNumbers: number[] = Object.values(Month).filter(
    (value): boolean => typeof value === 'number'
) as number[];
