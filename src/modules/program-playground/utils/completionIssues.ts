import type { FieldStateMap } from '@nnkogift/dhis2-form-utils-rules'

export const COMPLETION_ISSUE_KIND = {
    ERROR: 'error',
    WARNING: 'warning',
    MANDATORY: 'mandatory',
} as const

export type CompletionIssueKind =
    (typeof COMPLETION_ISSUE_KIND)[keyof typeof COMPLETION_ISSUE_KIND]

export type CompletionIssue = {
    key: string
    kind: CompletionIssueKind
    /** Absent for messages not tied to a data element or attribute. */
    fieldId?: string
    label?: string
    message: string
}

export type CompletionOrphanMessage = {
    key: string
    kind:
        | typeof COMPLETION_ISSUE_KIND.ERROR
        | typeof COMPLETION_ISSUE_KIND.WARNING
    message: string
}

type ComputeCompletionIssuesInput = {
    fieldStates: FieldStateMap
    values: Record<string, unknown>
    mandatoryFieldIds: readonly string[]
    orphanMessages: readonly CompletionOrphanMessage[]
    resolveFieldName: (fieldId: string) => string
}

function isEmpty(value: unknown) {
    return (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '')
    )
}

export function isBlocking(issue: CompletionIssue) {
    return issue.kind !== COMPLETION_ISSUE_KIND.WARNING
}

export function computeCompletionIssues({
    fieldStates,
    values,
    mandatoryFieldIds,
    orphanMessages,
    resolveFieldName,
}: ComputeCompletionIssuesInput): CompletionIssue[] {
    const issues: CompletionIssue[] = []
    const mandatory = new Set(mandatoryFieldIds)
    for (const [fieldId, state] of Object.entries(fieldStates)) {
        if (state.mandatory) {
            mandatory.add(fieldId)
        }
    }

    for (const fieldId of mandatory) {
        if (fieldStates[fieldId]?.hidden || !isEmpty(values[fieldId])) {
            continue
        }
        issues.push({
            key: `mandatory:${fieldId}`,
            kind: COMPLETION_ISSUE_KIND.MANDATORY,
            fieldId,
            label: resolveFieldName(fieldId),
            message: 'This field is required',
        })
    }

    for (const [fieldId, state] of Object.entries(fieldStates)) {
        if (state.hidden) {
            continue
        }
        if (state.errorOnComplete) {
            issues.push({
                key: `error:${fieldId}`,
                kind: COMPLETION_ISSUE_KIND.ERROR,
                fieldId,
                label: resolveFieldName(fieldId),
                message: state.errorOnComplete,
            })
        }
        if (state.warningOnComplete) {
            issues.push({
                key: `warning:${fieldId}`,
                kind: COMPLETION_ISSUE_KIND.WARNING,
                fieldId,
                label: resolveFieldName(fieldId),
                message: state.warningOnComplete,
            })
        }
    }

    for (const orphan of orphanMessages) {
        issues.push({ ...orphan })
    }

    // Blocking issues first so the banner leads with what stops completion.
    return issues.sort((a, b) => Number(isBlocking(b)) - Number(isBlocking(a)))
}
