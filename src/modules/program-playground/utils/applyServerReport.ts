import type {
    ServerReportEntry,
    ServerVerification,
} from '@nnkogift/dhis2-form-utils-devtools'
import type { FieldValues, UseFormReturn } from 'react-hook-form'

export const SERVER_ERROR_TYPE = 'server'

type ApplyServerReportOptions = {
    /** Whether a field with this id is on screen, so an error there can be seen. */
    isFieldRendered: (fieldId: string) => boolean
}

/**
 * Puts each server rule error on the field it targets. Returns the entries that
 * could not be placed (no target, field not on screen, or a warning, which has
 * no field state) so they can be shown in a notice instead.
 */
export function applyServerReport<TValues extends FieldValues>(
    form: Pick<UseFormReturn<TValues>, 'setError'>,
    report: ServerVerification,
    { isFieldRendered }: ApplyServerReportOptions
): ServerReportEntry[] {
    const unplaced: ServerReportEntry[] = []
    for (const entry of report.entries) {
        const { targetId } = entry
        if (
            entry.level === 'ERROR' &&
            targetId !== undefined &&
            isFieldRendered(targetId)
        ) {
            form.setError(targetId as never, {
                type: SERVER_ERROR_TYPE,
                message: entry.message,
            })
        } else {
            unplaced.push(entry)
        }
    }
    return unplaced
}
