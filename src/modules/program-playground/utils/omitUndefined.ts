/**
 * `getValues()` carries untouched fields as `undefined`, which the payload
 * schemas reject; the resolver output a save gets omits them.
 */
export function omitUndefined<T extends object>(values: T): T {
    return Object.fromEntries(
        Object.entries(values).filter(([, value]) => value !== undefined)
    ) as T
}
