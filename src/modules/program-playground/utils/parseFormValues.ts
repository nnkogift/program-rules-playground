import { filterPayload } from '@nnkogift/dhis2-form-utils-rules'
import i18n from '@dhis2/d2-i18n'
import type { z } from 'zod'

type FilterArgs = Parameters<typeof filterPayload>

type FormStoreLike = {
    fieldStore: { getSnapshot: () => FilterArgs[1] }
    optionGroups: FilterArgs[2]
}

type ParseContext = {
    formStore: FormStoreLike
    ensureOrgUnit: () => void
}

/**
 * Drops rule-hidden values and validates the rest against `schema`. Throws a
 * user-facing error when validation fails; a missing org unit gets its own
 * message and triggers `ensureOrgUnit` so the picker can flag it.
 */
export function parseFormValues<Schema extends z.ZodTypeAny>(
    schema: Schema,
    values: FilterArgs[0] & { orgUnit?: unknown },
    { formStore, ensureOrgUnit }: ParseContext
): z.infer<Schema> {
    const parsed = schema.safeParse(
        filterPayload(
            values,
            formStore.fieldStore.getSnapshot(),
            formStore.optionGroups
        )
    )
    if (parsed.success) {
        return parsed.data
    }
    if (!values.orgUnit) {
        ensureOrgUnit()
        throw new Error(
            i18n.t('Select an organisation unit before saving or verifying')
        )
    }
    throw new Error(
        i18n.t('The form values could not be validated before saving')
    )
}
