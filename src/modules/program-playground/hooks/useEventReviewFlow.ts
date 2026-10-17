import { useState } from 'react'
import type { EventStatus } from '@/modules/program-playground/utils/trackerPayloads'

type Review = { status: EventStatus; values: Record<string, unknown> }

type CompletionControl = {
    phase: 'idle' | 'evaluating' | 'review'
    start: () => Promise<'proceed' | 'review'>
    cancel: () => void
}

type UseEventReviewFlowOptions = {
    completion: CompletionControl
    ensureOrgUnit: () => void
    getValues: () => Record<string, unknown>
    /** Its values are merged under the event's own values in the summary. */
    enrollment?: { values: Record<string, unknown> }
}

/**
 * The save / complete flow of an event form: which status the read-only
 * summary was opened for, and the handlers that open and dismiss it.
 */
export function useEventReviewFlow({
    completion,
    ensureOrgUnit,
    getValues,
    enrollment,
}: UseEventReviewFlowOptions) {
    const [verifyStatus, setVerifyStatus] = useState<EventStatus>('ACTIVE')
    const [review, setReview] = useState<Review>()

    const openReview = (status: EventStatus) => {
        ensureOrgUnit()
        setVerifyStatus(status)
        setReview({ status, values: { ...enrollment?.values, ...getValues() } })
    }

    const handleCancelReview = () => {
        if (review?.status === 'COMPLETED') {
            completion.cancel()
        }
        setReview(undefined)
    }

    const handleComplete = async () => {
        if ((await completion.start()) === 'proceed') {
            openReview('COMPLETED')
        }
    }

    const handleSave = () => {
        if (completion.phase !== 'idle') {
            completion.cancel()
        }
        openReview('ACTIVE')
    }

    return {
        review,
        verifyStatus,
        openReview,
        handleCancelReview,
        handleComplete,
        handleSave,
    }
}
