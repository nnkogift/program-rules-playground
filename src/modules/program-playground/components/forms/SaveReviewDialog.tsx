import i18n from '@dhis2/d2-i18n'
import { Button, ButtonStrip } from '@dhis2/ui'
import type { DevtoolsLabelLookup } from '@nnkogift/dhis2-form-utils-devtools'
import { ServerEffectsSummary } from '@nnkogift/dhis2-form-utils-devtools'
import type {
    FormStore,
    RuleTraceEntry,
} from '@nnkogift/dhis2-form-utils-hooks'
import { useEffect, useState } from 'react'
import type { EventStatus } from '@/modules/program-playground/utils/trackerPayloads'

type SaveReviewDialogProps = {
    formStore: FormStore
    status: EventStatus
    programId: string
    /** Snapshot taken when the dialog opened, including enrollment values for `A{}` placeholders. */
    values: Record<string, unknown>
    labelLookup: DevtoolsLabelLookup
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
    programId,
    values,
    labelLookup,
    onCancel,
    onConfirm,
}: SaveReviewDialogProps) {
    const [traceEntry, setTraceEntry] = useState<RuleTraceEntry | null>(null)

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
            footer={
                <ButtonStrip end>
                    <Button secondary type="button" onClick={onCancel}>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button primary type="button" onClick={onConfirm}>
                        {status === 'COMPLETED'
                            ? i18n.t('Confirm complete')
                            : i18n.t('Confirm save')}
                    </Button>
                </ButtonStrip>
            }
        />
    )
}
