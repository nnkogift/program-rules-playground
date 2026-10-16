import { useAlert } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { Button } from '@dhis2/ui'
import type { DevtoolsLabelLookup } from '@nnkogift/dhis2-form-utils-devtools'
import { ServerEffectsSummary } from '@nnkogift/dhis2-form-utils-devtools'
import type {
    FormStore,
    RuleTraceEntry,
} from '@nnkogift/dhis2-form-utils-hooks'
import { useEffect, useState } from 'react'
import { ServerCheckStatus } from './ServerCheckStatus'
import { useServerVerification } from '@/modules/program-playground/hooks/useServerVerification'
import type { EventStatus } from '@/modules/program-playground/utils/trackerPayloads'

type SaveReviewDialogProps = {
    formStore: FormStore
    status: EventStatus
    confirmLabel: string
    programId: string
    /** Snapshot taken when the dialog opened, including enrollment values for `A{}` placeholders. */
    values: Record<string, unknown>
    labelLookup: DevtoolsLabelLookup
    /** Builds the exact payload the save would send; used for the dry run. */
    buildPayload: () => object
    /** Rule id to its declared action types, to tell SHOWERROR from ERRORONCOMPLETE. */
    actionTypesByRule: ReadonlyMap<string, readonly string[]>
    onCancel: () => void
    onConfirm: () => void
}

/**
 * Shows the server-side rule effects (messages, scheduled events) the tracker
 * importer will run before anything is posted. Mount it only while open so the
 * trace subscription is not held for the lifetime of the form.
 */
export function SaveReviewDialog({
    formStore,
    status,
    confirmLabel,
    programId,
    values,
    labelLookup,
    buildPayload,
    actionTypesByRule,
    onCancel,
    onConfirm,
}: SaveReviewDialogProps) {
    const [traceEntry, setTraceEntry] = useState<RuleTraceEntry | null>(null)
    const { show: showError } = useAlert(
        (message: string) =>
            i18n.t('Could not verify with server: {{message}}', { message }),
        { critical: true }
    )
    const { state: verification, verify } = useServerVerification({
        status,
        actionTypesByRule,
        buildPayload,
        onError: showError,
    })
    const report = verification.phase === 'done' ? verification.report : null
    const hasVerified =
        verification.phase === 'done' || verification.phase === 'error'

    // `subscribeTrace` replays the latest entry, so this lands the current one.
    useEffect(() => formStore.subscribeTrace(setTraceEntry), [formStore])

    return (
        <ServerEffectsSummary
            open
            onClose={onCancel}
            programId={programId}
            traceEntry={traceEntry}
            values={values}
            labelLookup={labelLookup}
            serverReport={report?.verification}
            // The summary renders these inside its button strip, beside its own
            // Close button, so each is a separate item rather than one column.
            footer={[
                <ServerCheckStatus key="status" state={verification} />,
                <Button
                    key="verify"
                    secondary
                    type="button"
                    loading={verification.phase === 'loading'}
                    disabled={verification.phase === 'loading'}
                    onClick={() => {
                        void verify()
                    }}
                >
                    {hasVerified
                        ? i18n.t('Verify again')
                        : i18n.t('Verify with server')}
                </Button>,
                <Button key="confirm" primary type="button" onClick={onConfirm}>
                    {confirmLabel}
                </Button>,
            ]}
        />
    )
}
