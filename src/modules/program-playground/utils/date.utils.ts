export function createTodayValue(): string {
    return new Date().toISOString().slice(0, 10)
}
