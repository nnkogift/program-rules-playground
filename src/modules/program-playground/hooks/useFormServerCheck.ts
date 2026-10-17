import type { ServerReportEntry } from '@nnkogift/dhis2-form-utils-devtools'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import {
    useServerVerification,
    type ServerVerificationState,
} from './useServerVerification'
import { applyServerReport } from '@/modules/program-playground/utils/applyServerReport'
import { isFieldRendered } from '@/modules/program-playground/utils/focusField'
import type { EventStatus } from '@/modules/program-playground/utils/trackerPayloads'

type UseFormServerCheckOptions<TValues extends FieldValues> = {
    form: Pick<UseFormReturn<TValues>, 'setError' | 'clearErrors'>
    status: EventStatus
    actionTypesByRule: ReadonlyMap<string, readonly string[]>
    /** Builds the exact payload a save would send; may throw. */
    buildPayload: () => object
}

const noop = () => undefined

/**
 * Dry-runs the form against the server and reflects the result on the form:
 * rule errors land on the field they target, and whatever cannot be placed on
 * a field is returned as `unplaced` for a notice.
 */
export function useFormServerCheck<TValues extends FieldValues>({
    form,
    status,
    actionTypesByRule,
    buildPayload,
}: UseFormServerCheckOptions<TValues>): {
    state: ServerVerificationState
    verify: () => Promise<void>
    unplaced: ServerReportEntry[]
} {
    const { state, verify: runVerify } = useServerVerification({
        status,
        actionTypesByRule,
        buildPayload,
        onError: noop,
    })
    const [unplaced, setUnplaced] = useState<ServerReportEntry[]>([])
    const placedFieldIds = useRef<string[]>([])
    const { clearErrors, setError } = form

    const clearPlaced = useCallback(() => {
        for (const fieldId of placedFieldIds.current) {
            clearErrors(fieldId as never)
        }
        placedFieldIds.current = []
    }, [clearErrors])

    const verify = useCallback(async () => {
        clearPlaced()
        setUnplaced([])
        await runVerify()
    }, [clearPlaced, runVerify])

    const report = state.phase === 'done' ? state.report : undefined
    useEffect(() => {
        if (!report) {
            return
        }
        const rest = applyServerReport({ setError }, report.verification, {
            isFieldRendered,
        })
        placedFieldIds.current = report.verification.entries
            .filter((entry) => !rest.includes(entry) && entry.targetId)
            .map((entry) => entry.targetId as string)
        setUnplaced(rest)
    }, [report, setError])

    return { state, verify, unplaced }
}
