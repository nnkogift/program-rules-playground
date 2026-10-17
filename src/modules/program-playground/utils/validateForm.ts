import type { FieldValues, UseFormReturn } from 'react-hook-form'

/** Runs the form's own validation so field errors are highlighted; nothing is submitted. */
export async function validateForm<TValues extends FieldValues>(
    form: Pick<UseFormReturn<TValues>, 'handleSubmit'>
): Promise<boolean> {
    let valid = false
    await form.handleSubmit(() => {
        valid = true
    })()
    return valid
}
