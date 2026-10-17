import i18n from '@dhis2/d2-i18n'
import type {
    DevtoolsLabelLookup,
    ServerVerification,
} from '@nnkogift/dhis2-form-utils-devtools'
import { ServerEffectsSummary } from '@nnkogift/dhis2-form-utils-devtools'
import type {
    FormStore,
    RuleTraceEntry,
} from '@nnkogift/dhis2-form-utils-hooks'
import { useEffect, useState } from 'react'

type SaveReviewDialogProps = {
    formStore: FormStore
    programId: string
    /** Snapshot taken when the dialog opened, including enrollment values for `A{}` placeholders. */
    values: Record<string, unknown>
    labelLookup: DevtoolsLabelLookup
    /** The last "Verify with server" result, compared against the simulation. */
    serverReport?: ServerVerification
    onClose: () => void
}

/**
 * Shows the server-side rule effects (messages, scheduled events) the tracker
 * importer would run. Read-only: verification is started from the form. Mount
 * it only while open so the trace subscription is not held for the lifetime of
 * the form.
 */
export function SaveReviewDialog({
    formStore,
    programId,
    values,
    labelLookup,
    serverReport,
    onClose,
}: SaveReviewDialogProps) {
    const [traceEntry, setTraceEntry] = useState<RuleTraceEntry | null>(null)

    // `subscribeTrace` replays the latest entry, so this lands the current one.
    useEffect(() => formStore.subscribeTrace(setTraceEntry), [formStore])

    return (
        <ServerEffectsSummary
            open
            onClose={onClose}
            programId={programId}
            traceEntry={traceEntry}
            values={values}
            labelLookup={labelLookup}
            serverReport={serverReport}
            footer={[
                <p
                    key="caveat"
                    className="m-0 max-w-[380px] text-left text-xs leading-4 text-dhis2-grey-700"
                >
                    {serverReport
                        ? i18n.t(
                              "The dry run doesn't report notifications, so notification rows stay Simulated."
                          )
                        : i18n.t(
                              'Use Verify with server on the form to compare against the server.'
                          )}
                </p>,
            ]}
        />
    )
}
