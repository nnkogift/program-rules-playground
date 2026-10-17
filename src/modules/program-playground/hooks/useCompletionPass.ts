import type { FormStore } from '@nnkogift/dhis2-form-utils-hooks'
import type { EffectHandlersMap } from '@nnkogift/dhis2-form-utils-rules'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import {
    COMPLETION_ISSUE_KIND,
    computeCompletionIssues,
    isBlocking,
    type CompletionIssue,
    type CompletionOrphanMessage,
} from '@/modules/program-playground/utils/completionIssues'

// The rule engine re-evaluates 40ms after a form value change, and the field
// store only notifies when the map actually changed, so an evaluation that
// changes nothing never tells us it ran. Fall back to a timer for that case.
const EVALUATION_FALLBACK_MS = 150

const COMPLETION_PHASE = {
    IDLE: 'idle',
    EVALUATING: 'evaluating',
    REVIEW: 'review',
} as const

type CompletionPhase = (typeof COMPLETION_PHASE)[keyof typeof COMPLETION_PHASE]

type CompletionOutcome = 'proceed' | 'review'

/**
 * WARNINGONCOMPLETE / ERRORONCOMPLETE effects with no data element or
 * attribute are dropped by the field map, so they are only reachable through
 * the engine's effect handlers. The handlers must be passed to `useEventForm`
 * (which captures them once), so the collector is created before the form.
 */
export function useCompletionMessageCollector() {
    const messages = useRef(new Map<string, CompletionOrphanMessage>())

    const handlers = useMemo(() => {
        const collect =
            (kind: CompletionOrphanMessage['kind']) =>
            (effect: {
                ruleId: string
                content?: string | null
                data?: string | null
                dataElement?: string | null
                trackedEntityAttribute?: string | null
            }) => {
                if (effect.dataElement || effect.trackedEntityAttribute) {
                    return
                }
                const message = [effect.content, effect.data]
                    .filter(Boolean)
                    .join(' ')
                const key = `${kind}:${effect.ruleId}:${message}`
                messages.current.set(key, { key, kind, message })
            }
        return {
            WARNINGONCOMPLETE: collect(COMPLETION_ISSUE_KIND.WARNING),
            ERRORONCOMPLETE: collect(COMPLETION_ISSUE_KIND.ERROR),
        } as EffectHandlersMap
    }, [])

    return useMemo(
        () => ({
            handlers,
            getMessages: () => Array.from(messages.current.values()),
            clear: () => messages.current.clear(),
        }),
        [handlers]
    )
}

type UseCompletionPassOptions = {
    // The hook only touches system fields (`status`), so it is agnostic to the form's value shape.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: UseFormReturn<any>
    formStore: FormStore
    collector: ReturnType<typeof useCompletionMessageCollector>
    mandatoryFieldIds: readonly string[]
    resolveFieldName: (fieldId: string) => string
}

export function useCompletionPass({
    form,
    formStore,
    collector,
    mandatoryFieldIds,
    resolveFieldName,
}: UseCompletionPassOptions) {
    const [phase, setPhase] = useState<CompletionPhase>(COMPLETION_PHASE.IDLE)
    const [issues, setIssues] = useState<CompletionIssue[]>([])
    const phaseRef = useRef(phase)
    phaseRef.current = phase

    const collect = useCallback(
        () =>
            computeCompletionIssues({
                fieldStates: formStore.fieldStore.getSnapshot(),
                values: form.getValues(),
                mandatoryFieldIds,
                orphanMessages: collector.getMessages(),
                resolveFieldName,
            }),
        [form, formStore, collector, mandatoryFieldIds, resolveFieldName]
    )

    const cancel = useCallback(() => {
        form.setValue('status', 'ACTIVE')
        collector.clear()
        setIssues([])
        setPhase(COMPLETION_PHASE.IDLE)
    }, [form, collector])

    const start = useCallback(async (): Promise<CompletionOutcome> => {
        setPhase(COMPLETION_PHASE.EVALUATING)
        collector.clear()

        const evaluated = new Promise<void>((resolve) => {
            const timer = setTimeout(() => {
                unsubscribe()
                resolve()
            }, EVALUATION_FALLBACK_MS)
            const unsubscribe = formStore.fieldStore.subscribeAll(() => {
                clearTimeout(timer)
                unsubscribe()
                // Other fields may still be landing in the same evaluation.
                setTimeout(resolve, 0)
            })
        })
        form.setValue('status', 'COMPLETED')
        await evaluated

        const found = collect()
        setIssues(found)
        if (found.length === 0) {
            setPhase(COMPLETION_PHASE.IDLE)
            return 'proceed'
        }
        setPhase(COMPLETION_PHASE.REVIEW)
        return 'review'
    }, [form, formStore, collector, collect])

    // Any edit invalidates the messages collected by the previous evaluation;
    // the evaluation that follows (debounced) repopulates them.
    useEffect(() => {
        const subscription = form.subscribe({
            formState: { values: true },
            callback: () => collector.clear(),
        })
        return subscription
    }, [form, collector])

    // While reviewing, keep the banner in step with the user's fixes.
    useEffect(() => {
        if (phase !== COMPLETION_PHASE.REVIEW) {
            return
        }
        return formStore.fieldStore.subscribeAll(() => {
            // Give the effect handlers (which run before the stores update) a tick.
            setTimeout(() => {
                if (phaseRef.current !== COMPLETION_PHASE.REVIEW) {
                    return
                }
                const next = collect()
                setIssues(next)
                if (next.length === 0) {
                    setPhase(COMPLETION_PHASE.IDLE)
                }
            }, 0)
        })
    }, [phase, formStore, collect])

    return {
        phase,
        issues,
        canCompleteAnyway:
            phase === COMPLETION_PHASE.REVIEW && !issues.some(isBlocking),
        isEvaluating: phase === COMPLETION_PHASE.EVALUATING,
        start,
        cancel,
        /** Clears the review state after a successful completion. */
        finish: useCallback(() => {
            setIssues([])
            setPhase(COMPLETION_PHASE.IDLE)
        }, []),
    }
}
