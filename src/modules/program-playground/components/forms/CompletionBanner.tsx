import i18n from '@dhis2/d2-i18n'
import { Button, ButtonStrip, NoticeBox } from '@dhis2/ui'
import { useEffect, useRef } from 'react'
import {
    COMPLETION_ISSUE_KIND,
    isBlocking,
    type CompletionIssue,
} from '@/modules/program-playground/utils/completionIssues'

type CompletionBannerProps = {
    issues: CompletionIssue[]
    isSubmitting?: boolean
    onBackToEditing: () => void
    onCompleteAnyway: () => void
}

const FOCUSABLE =
    'input, textarea, select, button, [tabindex]:not([tabindex="-1"]), [data-test="dhis2-uicore-select-input"]'

export function focusField(fieldId: string) {
    const target = Array.from(
        document.querySelectorAll<HTMLElement>('[data-field-id]')
    ).find((element) => element.dataset.fieldId === fieldId)
    if (!target) {
        return
    }
    const reduceMotion = window.matchMedia?.(
        '(prefers-reduced-motion: reduce)'
    ).matches
    target.scrollIntoView({
        block: 'center',
        behavior: reduceMotion ? 'auto' : 'smooth',
    })
    target.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true })
}

const KIND_LABELS = {
    [COMPLETION_ISSUE_KIND.ERROR]: i18n.t('Error'),
    [COMPLETION_ISSUE_KIND.MANDATORY]: i18n.t('Required'),
    [COMPLETION_ISSUE_KIND.WARNING]: i18n.t('Warning'),
}

export function CompletionBanner({
    issues,
    isSubmitting,
    onBackToEditing,
    onCompleteAnyway,
}: CompletionBannerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const blocking = issues.some(isBlocking)

    // Move focus to the summary when it first appears so keyboard and screen
    // reader users land on it (it is a focus target, not a focus trap).
    useEffect(() => {
        containerRef.current?.focus()
    }, [])

    const title = blocking
        ? i18n.t('Cannot complete this event yet')
        : i18n.t('Review before completing')

    return (
        <div
            ref={containerRef}
            role="alert"
            tabIndex={-1}
            data-test="completion-banner"
            className="flex flex-col gap-dp8 outline-none"
        >
            <NoticeBox error={blocking} warning={!blocking} title={title}>
                <ul className="m-0 flex list-none flex-col gap-1 p-0">
                    {issues.map((issue) => (
                        <li key={issue.key} className="text-sm leading-5">
                            <span className="font-semibold">
                                {KIND_LABELS[issue.kind]}
                                {': '}
                            </span>
                            {issue.fieldId ? (
                                <button
                                    type="button"
                                    className="cursor-pointer border-0 bg-transparent p-0 text-left text-inherit underline"
                                    onClick={() => focusField(issue.fieldId!)}
                                >
                                    {issue.label}
                                </button>
                            ) : null}
                            {issue.fieldId ? ' – ' : null}
                            {issue.message}
                        </li>
                    ))}
                </ul>
            </NoticeBox>
            <ButtonStrip end>
                <Button
                    secondary
                    type="button"
                    disabled={isSubmitting}
                    onClick={onBackToEditing}
                >
                    {i18n.t('Back to editing')}
                </Button>
                {!blocking && (
                    <Button
                        primary
                        type="button"
                        loading={isSubmitting}
                        disabled={isSubmitting}
                        onClick={onCompleteAnyway}
                    >
                        {i18n.t('Complete anyway')}
                    </Button>
                )}
            </ButtonStrip>
        </div>
    )
}
