import i18n from '@dhis2/d2-i18n'
import { Button, ButtonStrip } from '@dhis2/ui'
import { useState } from 'react'
import { useFormState } from 'react-hook-form'
import { ServerCheckStatus } from './ServerCheckStatus'
import { ValidationNotice } from './ValidationNotice'
import type { ServerVerificationState } from '@/modules/program-playground/hooks/useServerVerification'
import { useFormValidation } from '@/modules/program-playground/hooks/useFormValidation'
import type { ServerReportEntry } from '@nnkogift/dhis2-form-utils-devtools'

type ServerCheck = {
    state: ServerVerificationState
    /** Rule messages that could not be shown on a field. */
    unplaced: ServerReportEntry[]
    onVerify: () => void
}

type ProgramFormActionsBaseProps = {
    /** Complete is mid-pass (loading) or awaiting the banner's decision (disabled). */
    completionPhase?: 'idle' | 'evaluating' | 'review'
    /** Dry-runs the form against the server; its outcome shows above the buttons. */
    serverCheck?: ServerCheck
    /** Runs the form's validation only, resolving to whether it passed. */
    onValidate?: () => Promise<boolean>
    /** Names an invalid field in the issue summary; falls back to the field id. */
    resolveFieldLabel?: (fieldId: string) => string | undefined
}

type SingleActionProps = ProgramFormActionsBaseProps & {
    submitLabel: string
    onSave?: never
    onComplete?: never
}

type SaveCompleteActionProps = ProgramFormActionsBaseProps & {
    submitLabel?: never
    onSave: () => void
    onComplete: () => void
}

type ProgramFormActionsProps = SingleActionProps | SaveCompleteActionProps

type PendingAction = 'save' | 'complete' | 'validate'

export function ProgramFormActions({
    submitLabel,
    serverCheck,
    onSave,
    onComplete,
    completionPhase = 'idle',
    onValidate,
    resolveFieldLabel,
}: ProgramFormActionsProps) {
    const { isSubmitting, errors } = useFormState()
    const isEvaluating = completionPhase === 'evaluating'
    const [pendingAction, setPendingAction] = useState<PendingAction>()
    const validation = useFormValidation(onValidate)
    const invalidFieldIds = Object.keys(errors).filter((id) => id !== 'root')

    const handleValidate = () => {
        setPendingAction('validate')
        void validation.validate()
    }

    return (
        <>
            {serverCheck ? (
                <ServerCheckStatus
                    state={serverCheck.state}
                    unplaced={serverCheck.unplaced}
                    resolveFieldLabel={resolveFieldLabel}
                />
            ) : null}
            <ValidationNotice
                result={validation.result}
                failure={validation.failure}
                invalidFieldIds={invalidFieldIds}
                issueSummaryRef={validation.issueSummaryRef}
                resolveFieldLabel={resolveFieldLabel}
            />
            <ButtonStrip end>
                {onValidate ? (
                    <Button
                        type="button"
                        loading={isSubmitting && pendingAction === 'validate'}
                        disabled={isSubmitting || isEvaluating}
                        onClick={handleValidate}
                    >
                        {i18n.t('Validate form')}
                    </Button>
                ) : null}
                {serverCheck ? (
                    <VerifyButton
                        serverCheck={serverCheck}
                        disabled={isSubmitting || isEvaluating}
                    />
                ) : null}
                {onSave && onComplete ? (
                    <SplitActionButtons
                        pendingAction={pendingAction}
                        isSubmitting={isSubmitting}
                        completionPhase={completionPhase}
                        onSave={() => {
                            setPendingAction('save')
                            onSave()
                        }}
                        onComplete={() => {
                            setPendingAction('complete')
                            onComplete()
                        }}
                    />
                ) : (
                    <Button
                        primary
                        type="submit"
                        loading={isSubmitting}
                        disabled={isSubmitting}
                    >
                        {submitLabel}
                    </Button>
                )}
            </ButtonStrip>
        </>
    )
}

type VerifyButtonProps = {
    serverCheck: ServerCheck
    /** Already true while submitting or while the completion pass runs. */
    disabled: boolean
}

function VerifyButton({ serverCheck, disabled }: VerifyButtonProps) {
    const isVerifying = serverCheck.state.phase === 'loading'
    return (
        <Button
            type="button"
            loading={isVerifying}
            disabled={disabled || isVerifying}
            onClick={serverCheck.onVerify}
        >
            {i18n.t('Verify with server')}
        </Button>
    )
}

type SplitActionButtonsProps = {
    pendingAction: PendingAction | undefined
    isSubmitting: boolean
    completionPhase: 'idle' | 'evaluating' | 'review'
    onSave: () => void
    onComplete: () => void
}

function SplitActionButtons({
    pendingAction,
    isSubmitting,
    completionPhase,
    onSave,
    onComplete,
}: SplitActionButtonsProps) {
    return (
        <>
            <Button
                secondary
                type="button"
                loading={isSubmitting && pendingAction === 'save'}
                disabled={isSubmitting || completionPhase === 'evaluating'}
                onClick={onSave}
            >
                {i18n.t('Preview server effects')}
            </Button>
            <Button
                primary
                type="button"
                loading={
                    completionPhase === 'evaluating' ||
                    (isSubmitting && pendingAction === 'complete')
                }
                disabled={isSubmitting || completionPhase !== 'idle'}
                onClick={onComplete}
            >
                {i18n.t('Preview on-complete effects')}
            </Button>
        </>
    )
}
