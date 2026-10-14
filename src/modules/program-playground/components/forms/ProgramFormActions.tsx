import i18n from '@dhis2/d2-i18n'
import { Button, ButtonStrip, NoticeBox } from '@dhis2/ui'
import { useState } from 'react'
import { useFormState } from 'react-hook-form'

type ProgramFormActionsBaseProps = {
    errorTitle: string
    successMessage?: string
    successTitle?: string
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

type PendingAction = 'save' | 'complete'

export function ProgramFormActions({
    submitLabel,
    errorTitle,
    successMessage,
    successTitle = i18n.t('Saved'),
    onSave,
    onComplete,
}: ProgramFormActionsProps) {
    const { isSubmitting, errors } = useFormState()
    const [pendingAction, setPendingAction] = useState<PendingAction>()
    const hasSplitActions = onSave !== undefined && onComplete !== undefined

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
            <ButtonStrip end>
                {hasSplitActions && (
                    <Button
                        secondary
                        type="button"
                        loading={isSubmitting && pendingAction === 'save'}
                        disabled={isSubmitting}
                        onClick={() => {
                            setPendingAction('save')
                            onSave?.()
                        }}
                    >
                        {i18n.t('Save')}
                    </Button>
                )}
                {hasSplitActions && (
                    <Button
                        primary
                        type="button"
                        loading={isSubmitting && pendingAction === 'complete'}
                        disabled={isSubmitting}
                        onClick={() => {
                            setPendingAction('complete')
                            onComplete?.()
                        }}
                    >
                        {i18n.t('Complete')}
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
