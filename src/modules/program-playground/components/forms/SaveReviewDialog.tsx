import i18n from '@dhis2/d2-i18n'
import { Button, ButtonStrip, NoticeBox } from '@dhis2/ui'
import type { DevtoolsLabelLookup } from '@nnkogift/dhis2-form-utils-devtools'
import { ServerEffectsSummary } from '@nnkogift/dhis2-form-utils-devtools'
import type {
    FormStore,
    RuleTraceEntry,
} from '@nnkogift/dhis2-form-utils-hooks'
import { useEffect, useState } from 'react'
import { OtherImportErrors } from './OtherImportErrors'
import { useServerVerification } from '@/modules/program-playground/hooks/useServerVerification'
import type { EventStatus } from '@/modules/program-playground/utils/trackerPayloads'

type SaveReviewDialogProps = {
    formStore: FormStore
    status: EventStatus
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
    programId,
    values,
    labelLookup,
    buildPayload,
    actionTypesByRule,
    onCancel,
    onConfirm,
}: SaveReviewDialogProps) {
    const [traceEntry, setTraceEntry] = useState<RuleTraceEntry | null>(null)
    const { state: verification, verify } = useServerVerification({
        status,
        actionTypesByRule,
        buildPayload,
    })
    const report = verification.phase === 'done' ? verification.report : null

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
            footer={
                <div className="flex flex-col gap-dp8">
                    <p className="m-0 text-sm">
                        {i18n.t(
                            "The dry run doesn't report notifications, so notification rows stay Simulated."
                        )}
                    </p>
                    {report ? (
                        <OtherImportErrors errors={report.otherErrors} />
                    ) : null}
                    {verification.phase === 'error' ? (
                        <NoticeBox
                            error
                            title={i18n.t('Could not verify with server')}
                        >
                            {verification.message}
                        </NoticeBox>
                    ) : null}
                    <ButtonStrip end>
                        <Button
                            secondary
                            type="button"
                            loading={verification.phase === 'loading'}
                            disabled={verification.phase === 'loading'}
                            onClick={() => {
                                void verify()
                            }}
                        >
                            {i18n.t('Verify with server')}
                        </Button>
                        <Button secondary type="button" onClick={onCancel}>
                            {i18n.t('Cancel')}
                        </Button>
                        <Button primary type="button" onClick={onConfirm}>
                            {status === 'COMPLETED'
                                ? i18n.t('Confirm complete')
                                : i18n.t('Confirm save')}
                        </Button>
                    </ButtonStrip>
                </div>
            }
        />
    )
}
