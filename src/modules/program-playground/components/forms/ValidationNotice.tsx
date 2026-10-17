import i18n from '@dhis2/d2-i18n'
import { NoticeBox } from '@dhis2/ui'
import type { Ref } from 'react'
import type { ValidationResult } from '@/modules/program-playground/hooks/useFormValidation'
import { focusField } from '@/modules/program-playground/utils/focusField'

type ValidationNoticeProps = {
    result: ValidationResult | undefined
    failure?: string
    invalidFieldIds: string[]
    issueSummaryRef: Ref<HTMLDivElement>
    /** Names an invalid field in the issue summary; falls back to the field id. */
    resolveFieldLabel?: (fieldId: string) => string | undefined
}

export function ValidationNotice({
    result,
    failure,
    invalidFieldIds,
    issueSummaryRef,
    resolveFieldLabel,
}: ValidationNoticeProps) {
    if (result === 'valid') {
        return (
            <div role="status">
                <NoticeBox title={i18n.t('Form is valid')}>
                    {i18n.t('No validation issues were found.')}
                </NoticeBox>
            </div>
        )
    }
    if (result === 'invalid') {
        return (
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
                                    {resolveFieldLabel?.(fieldId) ?? fieldId}
                                </button>
                            </li>
                        ))}
                    </ul>
                </NoticeBox>
            </div>
        )
    }
    if (result === 'failed') {
        return (
            <div role="alert">
                <NoticeBox error title={i18n.t('Could not validate the form')}>
                    {failure}
                </NoticeBox>
            </div>
        )
    }
    return null
}
