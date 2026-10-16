import i18n from '@dhis2/d2-i18n'
import { Button, ButtonStrip, NoticeBox } from '@dhis2/ui'
import { useState } from 'react'
import { useFormState } from 'react-hook-form'

type ProgramFormActionsBaseProps = {
    errorTitle: string
    successMessage?: string
    successTitle?: string
    /** Complete is mid-pass (loading) or awaiting the banner's decision (disabled). */
    completionPhase?: 'idle' | 'evaluating' | 'review'
    /** Runs the form's validation only, resolving to whether it passed. */
    onValidate?: () => Promise<boolean>
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
    errorTitle,
    successMessage,
    successTitle = i18n.t('Saved'),
    onSave,
    onComplete,
    completionPhase = 'idle',
    onValidate,
}: ProgramFormActionsProps) {
    const { isSubmitting, errors } = useFormState()
    const [pendingAction, setPendingAction] = useState<PendingAction>()
    const [validationPassed, setValidationPassed] = useState(false)
    const hasSplitActions = onSave !== undefined && onComplete !== undefined

    const handleValidate = async () => {
        if (!onValidate) {
            return
        }
        setPendingAction('validate')
        setValidationPassed(false)
        setValidationPassed(await onValidate())
    }

    return (
        <>
            {errors.root?.message ? (
                <NoticeBox error title={errorTitle}>
                    {errors.root.message}
                </NoticeBox>
            ) : null}
            {successMessage ? (
                <NoticeBox title={successTitle}>{successMessage}</NoticeBox>
            ) : null}
            {validationPassed && !errors.root?.message ? (
                <NoticeBox title={i18n.t('Form is valid')}>
                    {i18n.t('No validation issues were found.')}
                </NoticeBox>
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
