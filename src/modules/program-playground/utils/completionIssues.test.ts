import type { FieldState } from '@nnkogift/dhis2-form-utils-rules'
import {
    computeCompletionIssues,
    COMPLETION_ISSUE_KIND,
    isBlocking,
} from './completionIssues'

const field = (overrides: Partial<FieldState> = {}): FieldState => ({
    hidden: false,
    mandatory: false,
    warning: null,
    error: null,
    warningOnComplete: null,
    errorOnComplete: null,
    assignedValue: undefined,
    hiddenOptions: new Set(),
    hiddenOptionGroups: new Set(),
    ...overrides,
})

const base = {
    values: {},
    mandatoryFieldIds: [],
    orphanMessages: [],
    resolveFieldName: (id: string) => `Name ${id}`,
}

describe('computeCompletionIssues', () => {
    it('returns nothing when no field has on-complete effects', () => {
        expect(
            computeCompletionIssues({ ...base, fieldStates: { a: field() } })
        ).toEqual([])
    })

    it('reports errorOnComplete as blocking and warningOnComplete as non-blocking', () => {
        const issues = computeCompletionIssues({
            ...base,
            fieldStates: {
                a: field({ warningOnComplete: 'careful' }),
                b: field({ errorOnComplete: 'nope' }),
            },
        })
        expect(issues.map((i) => i.kind)).toEqual([
            COMPLETION_ISSUE_KIND.ERROR,
            COMPLETION_ISSUE_KIND.WARNING,
        ])
        expect(issues.map(isBlocking)).toEqual([true, false])
        expect(issues[0].label).toBe('Name b')
    })

    it('flags empty mandatory fields from metadata and from rules', () => {
        const issues = computeCompletionIssues({
            ...base,
            mandatoryFieldIds: ['meta'],
            values: { filled: 'x' },
            fieldStates: {
                rule: field({ mandatory: true }),
                filled: field({ mandatory: true }),
            },
        })
        expect(issues.map((i) => i.fieldId).sort()).toEqual(['meta', 'rule'])
        expect(issues.every(isBlocking)).toBe(true)
    })

    it('ignores hidden fields', () => {
        expect(
            computeCompletionIssues({
                ...base,
                mandatoryFieldIds: ['a'],
                fieldStates: {
                    a: field({ hidden: true }),
                    b: field({ hidden: true, errorOnComplete: 'x' }),
                },
            })
        ).toEqual([])
    })

    it('includes field-less messages without a fieldId', () => {
        const issues = computeCompletionIssues({
            ...base,
            fieldStates: {},
            orphanMessages: [
                { key: 'o', kind: COMPLETION_ISSUE_KIND.WARNING, message: 'm' },
            ],
        })
        expect(issues).toHaveLength(1)
        expect(issues[0].fieldId).toBeUndefined()
    })
})
