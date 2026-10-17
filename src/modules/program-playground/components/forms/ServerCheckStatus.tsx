import i18n from '@dhis2/d2-i18n'
import type { ServerReportEntry } from '@nnkogift/dhis2-form-utils-devtools'
import { NoticeBox } from '@dhis2/ui'
import { OtherImportErrors } from './OtherImportErrors'
import {
    currentReport,
    type ServerVerificationState,
} from '@/modules/program-playground/hooks/useServerVerification'
import { focusField } from '@/modules/program-playground/utils/focusField'

type ServerCheckStatusProps = {
    state: ServerVerificationState
    /** Rule messages that could not be shown on a field. */
    unplaced: ServerReportEntry[]
    resolveFieldLabel?: (fieldId: string) => string | undefined
}

/**
 * The server check's outcome as a notice above the form actions: failures, a
 * clean result, or what the server reported that no field could carry. Field
 * errors themselves are shown on the fields.
 */
export function ServerCheckStatus({
    state,
    unplaced,
    resolveFieldLabel,
}: ServerCheckStatusProps) {
    if (state.phase === 'error') {
        return (
            <div role="alert">
                <NoticeBox error title={i18n.t('Could not verify with server')}>
                    {state.message}
                </NoticeBox>
            </div>
        )
    }
    const report = currentReport(state)
    if (state.phase !== 'done' || !report) {
        return null
    }
    const otherErrors = report.otherErrors
    if (report.verification.entries.length === 0 && otherErrors.length === 0) {
        return (
            <div role="status">
                <NoticeBox title={i18n.t('Server check passed')}>
                    {i18n.t('Server found no rule errors or warnings.')}
                </NoticeBox>
            </div>
        )
    }
    if (unplaced.length === 0 && otherErrors.length === 0) {
        return (
            <div role="alert">
                <NoticeBox error title={i18n.t('Server check found issues')}>
                    {i18n.t('The affected fields are highlighted in the form.')}
                </NoticeBox>
            </div>
        )
    }
    return (
        <div role="alert">
            <NoticeBox error title={i18n.t('Server check found issues')}>
                {unplaced.length > 0 ? (
                    <ul className="m-0 pl-5">
                        {unplaced.map((entry) => (
                            <li key={`${entry.ruleId}:${entry.message}`}>
                                {entry.targetId ? (
                                    <button
                                        type="button"
                                        className="cursor-pointer border-0 bg-transparent p-0 text-left text-inherit underline"
                                        onClick={() => {
                                            focusField(entry.targetId ?? '')
                                        }}
                                    >
                                        {resolveFieldLabel?.(entry.targetId) ??
                                            entry.targetId}
                                    </button>
                                ) : null}
                                {entry.targetId ? ': ' : ''}
                                {entry.message}
                            </li>
                        ))}
                    </ul>
                ) : null}
                <OtherImportErrors errors={otherErrors} />
            </NoticeBox>
        </div>
    )
}
