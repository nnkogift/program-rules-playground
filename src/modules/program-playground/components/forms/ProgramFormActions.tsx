import i18n from '@dhis2/d2-i18n'
import { Button, ButtonStrip, NoticeBox } from '@dhis2/ui'
import { useRef, useState } from 'react'
import { useFormState } from 'react-hook-form'
import { ServerCheckStatus } from './ServerCheckStatus'
import type { ServerVerificationState } from '@/modules/program-playground/hooks/useServerVerification'
import { focusField } from '@/modules/program-playground/utils/focusField'
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

type ValidationResult = 'valid' | 'invalid' | 'failed'

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
    const isVerifying = serverCheck?.state.phase === 'loading'
    const [pendingAction, setPendingAction] = useState<PendingAction>()
    const [validationResult, setValidationResult] = useState<ValidationResult>()
    const [validationFailure, setValidationFailure] = useState<string>()
    const issueSummaryRef = useRef<HTMLDivElement>(null)
    const hasSplitActions = onSave !== undefined && onComplete !== undefined
    const invalidFieldIds = Object.keys(errors).filter((id) => id !== 'root')

    const handleValidate = async () => {
        if (!onValidate) {
            return
        }
        setPendingAction('validate')
        setValidationResult(undefined)
        setValidationFailure(undefined)
        try {
            const valid = await onValidate()
            setValidationResult(valid ? 'valid' : 'invalid')
            if (!valid) {
                // Wait for the summary to render before moving focus to it.
                requestAnimationFrame(() => issueSummaryRef.current?.focus())
            }
        } catch (error) {
            setValidationFailure(
                error instanceof Error ? error.message : String(error)
            )
            setValidationResult('failed')
        }
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
            {validationResult === 'valid' ? (
                <div role="status">
                    <NoticeBox title={i18n.t('Form is valid')}>
                        {i18n.t('No validation issues were found.')}
                    </NoticeBox>
                </div>
            ) : null}
            {validationResult === 'invalid' ? (
                <div ref={issueSummaryRef} role="alert" tabIndex={-1}>
                    <NoticeBox error title={i18n.t('Form has issues')}>
                        <ul className="m-0 pl-5">
                            {invalidFieldIds.map((fieldId) => (
                                <li key={fieldId}>
                                    <button
                                        type="button"
                                        className="cursor-pointer border-0 bg-transparent p-0 text-left text-inherit underline"
                                        onClick={() => {
                                            focusField(fieldId)
                                        }}
                                    >
                                        {resolveFieldLabel?.(fieldId) ??
                                            fieldId}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </NoticeBox>
                </div>
            ) : null}
            {validationResult === 'failed' ? (
                <div role="alert">
                    <NoticeBox
                        error
                        title={i18n.t('Could not validate the form')}
                    >
                        {validationFailure}
                    </NoticeBox>
                </div>
            ) : null}
            <ButtonStrip end>
                {onValidate && (
                    <Button
                        type="button"
                        loading={isSubmitting && pendingAction === 'validate'}
                        disabled={
                            isSubmitting || completionPhase === 'evaluating'
                        }
                        onClick={() => {
                            void handleValidate()
                        }}
                    >
                        {i18n.t('Validate form')}
                    </Button>
                )}
                {serverCheck && (
                    <Button
                        type="button"
                        loading={isVerifying}
                        disabled={
                            isSubmitting ||
                            isVerifying ||
                            completionPhase === 'evaluating'
                        }
                        onClick={serverCheck.onVerify}
                    >
                        {i18n.t('Verify with server')}
                    </Button>
                )}
                {hasSplitActions && (
                    <Button
                        secondary
                        type="button"
                        loading={isSubmitting && pendingAction === 'save'}
                        disabled={
                            isSubmitting || completionPhase === 'evaluating'
                        }
                        onClick={() => {
                            setPendingAction('save')
                            onSave?.()
                        }}
                    >
                        {i18n.t('Trigger server rules')}
                    </Button>
                )}
                {hasSplitActions && (
                    <Button
                        primary
                        type="button"
                        loading={
                            completionPhase === 'evaluating' ||
                            (isSubmitting && pendingAction === 'complete')
                        }
                        disabled={isSubmitting || completionPhase !== 'idle'}
                        onClick={() => {
                            setPendingAction('complete')
                            onComplete?.()
                        }}
                    >
                        {i18n.t('Trigger on-complete rules')}
                    </Button>
                )}
                {!hasSplitActions && (
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
