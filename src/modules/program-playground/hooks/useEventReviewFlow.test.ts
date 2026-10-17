import { act, renderHook } from '@testing-library/react'
import { useEventReviewFlow } from './useEventReviewFlow'

function setup(overrides: Record<string, unknown> = {}) {
    const completion = {
        phase: 'idle' as 'idle' | 'evaluating' | 'review',
        start: jest.fn().mockResolvedValue('proceed'),
        cancel: jest.fn(),
    }
    const ensureOrgUnit = jest.fn()
    const options = {
        completion,
        ensureOrgUnit,
        getValues: () => ({ a: 1 }),
        enrollment: { values: { b: 2 } },
        ...overrides,
    }
    const hook = renderHook(() => useEventReviewFlow(options as never))
    return { ...hook, completion, ensureOrgUnit }
}

describe('useEventReviewFlow', () => {
    it('starts with no review and an ACTIVE verify status', () => {
        const { result } = setup()

        expect(result.current.review).toBeUndefined()
        expect(result.current.verifyStatus).toBe('ACTIVE')
    })

    it('opens an ACTIVE review merging enrollment and form values on save', () => {
        const { result, ensureOrgUnit } = setup()

        act(() => {
            result.current.handleSave()
        })

        expect(ensureOrgUnit).toHaveBeenCalled()
        expect(result.current.review).toEqual({
            status: 'ACTIVE',
            values: { b: 2, a: 1 },
        })
    })

    it('cancels a running completion pass when saving', () => {
        const cancel = jest.fn()
        const { result } = setup({
            completion: { phase: 'review', start: jest.fn(), cancel },
        })

        act(() => {
            result.current.handleSave()
        })

        expect(cancel).toHaveBeenCalledTimes(1)
    })

    it('leaves an idle completion pass alone when saving', () => {
        const { result, completion } = setup()

        act(() => {
            result.current.handleSave()
        })

        expect(completion.cancel).not.toHaveBeenCalled()
    })

    it('opens a COMPLETED review when the completion pass proceeds', async () => {
        const { result } = setup()

        await act(async () => {
            await result.current.handleComplete()
        })

        expect(result.current.review?.status).toBe('COMPLETED')
        expect(result.current.verifyStatus).toBe('COMPLETED')
    })

    it('stays closed when the completion pass needs review', async () => {
        const { result } = setup({
            completion: {
                phase: 'idle',
                start: jest.fn().mockResolvedValue('review'),
                cancel: jest.fn(),
            },
        })

        await act(async () => {
            await result.current.handleComplete()
        })

        expect(result.current.review).toBeUndefined()
    })

    it('cancels the completion pass only when dismissing a COMPLETED review', async () => {
        const { result, completion } = setup()

        act(() => {
            result.current.openReview('ACTIVE')
        })
        act(() => {
            result.current.handleCancelReview()
        })
        expect(completion.cancel).not.toHaveBeenCalled()
        expect(result.current.review).toBeUndefined()

        await act(async () => {
            await result.current.handleComplete()
        })
        act(() => {
            result.current.handleCancelReview()
        })
        expect(completion.cancel).toHaveBeenCalledTimes(1)
    })
})
