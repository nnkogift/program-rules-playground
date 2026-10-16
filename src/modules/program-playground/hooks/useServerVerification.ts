import { useDataEngine } from '@dhis2/app-runtime'
import { useCallback, useState } from 'react'
import {
    parseRuleValidationReport,
    type ParsedRuleValidationReport,
    type ParseOptions,
} from '@/modules/program-playground/utils/parseRuleValidationReport'
import { formatDhis2Error } from '@/modules/program-playground/utils/formatDhis2Error'
import type { EventStatus } from '@/modules/program-playground/utils/trackerPayloads'

const DRY_RUN_PARAMS = { importMode: 'VALIDATE', async: false } as const

export type ServerVerificationState =
    | { phase: 'idle' }
    | { phase: 'loading' }
    | { phase: 'done'; report: ParsedRuleValidationReport }
    | { phase: 'error'; message: string }

type UseServerVerificationOptions = {
    status: EventStatus
    actionTypesByRule: ParseOptions['actionTypesByRule']
    /** Builds the exact payload the save would send; may throw. */
    buildPayload: () => object
    /** Called with the failure message when the dry run could not complete. */
    onError: (message: string) => void
}

/**
 * Runs the tracker importer in VALIDATE mode, which runs the server rule engine
 * and validation but persists nothing. Only runs when `verify` is called.
 */
export function useServerVerification({
    status,
    actionTypesByRule,
    buildPayload,
    onError,
}: UseServerVerificationOptions) {
    const dataEngine = useDataEngine()
    const [state, setState] = useState<ServerVerificationState>({
        phase: 'idle',
    })

    const verify = useCallback(async () => {
        const parseOptions = { status, actionTypesByRule }
        setState({ phase: 'loading' })
        try {
            const response = await dataEngine.mutate({
                resource: 'tracker',
                type: 'create',
                params: DRY_RUN_PARAMS,
                data: buildPayload(),
            })
            setState({
                phase: 'done',
                report: parseRuleValidationReport(response, parseOptions),
            })
        } catch (error) {
            const report = parseRuleValidationReport(error, parseOptions)
            // A VALIDATE run that found problems answers 409 with the report.
            if (
                report.verification.entries.length > 0 ||
                report.otherErrors.length > 0
            ) {
                setState({ phase: 'done', report })
                return
            }
            const message = formatDhis2Error(error)
            setState({ phase: 'error', message })
            onError(message)
        }
    }, [dataEngine, buildPayload, status, actionTypesByRule, onError])

    return { state, verify }
}
