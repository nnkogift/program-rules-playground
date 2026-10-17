import { resolveOnCompleteMessage } from './resolveOnCompleteMessage'

describe('resolveOnCompleteMessage', () => {
    it('returns null unless the status is COMPLETED', () => {
        expect(
            resolveOnCompleteMessage('ACTIVE', { errorOnComplete: 'bad' })
        ).toBeNull()
    })

    it('returns null without field state or messages', () => {
        expect(resolveOnCompleteMessage('COMPLETED', undefined)).toBeNull()
        expect(resolveOnCompleteMessage('COMPLETED', {})).toBeNull()
    })

    it('prefers the error over the warning', () => {
        expect(
            resolveOnCompleteMessage('COMPLETED', {
                errorOnComplete: 'bad',
                warningOnComplete: 'careful',
            })
        ).toEqual({ kind: 'error', text: 'bad' })
    })

    it('falls back to the warning', () => {
        expect(
            resolveOnCompleteMessage('COMPLETED', {
                warningOnComplete: 'careful',
            })
        ).toEqual({ kind: 'warning', text: 'careful' })
    })
})
