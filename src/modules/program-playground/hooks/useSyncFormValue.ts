import { useEffect } from 'react'
import type {
    FieldValues,
    Path,
    PathValue,
    UseFormReturn,
} from 'react-hook-form'

/**
 * Keeps a form value in step with a value owned outside the form (such as the
 * org unit or date picked in the context bar) without triggering validation.
 */
export function useSyncFormValue<TValues extends FieldValues>(
    form: Pick<UseFormReturn<TValues>, 'setValue'>,
    name: Path<TValues>,
    value: PathValue<TValues, Path<TValues>>
) {
    useEffect(() => {
        form.setValue(name, value, { shouldValidate: false })
    }, [form, name, value])
}
