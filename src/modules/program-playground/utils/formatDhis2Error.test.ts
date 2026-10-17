import { formatDhis2Error } from './formatDhis2Error'

describe('formatDhis2Error', () => {
    it('joins the messages of all error reports', () => {
        expect(
            formatDhis2Error({
                message: 'Bad request',
                details: {
                    response: {
                        message: 'Import failed',
                        errorReports: [
                            { message: 'First problem.' },
                            { message: 'Second problem.' },
                        ],
                    },
                },
            })
        ).toBe('First problem. Second problem.')
    })

    it('skips error reports without a message', () => {
        expect(
            formatDhis2Error({
                details: {
                    response: {
                        errorReports: [{}, { message: 'Only this.' }],
                    },
                },
            })
        ).toBe('Only this.')
    })

    it('falls back to the response message when there are no error reports', () => {
        expect(
            formatDhis2Error({
                message: 'Bad request',
                details: {
                    response: { message: 'Import failed', errorReports: [] },
                },
            })
        ).toBe('Import failed')
    })

    it('falls back to the error message', () => {
        expect(formatDhis2Error(new Error('Network down'))).toBe('Network down')
    })

    it('returns a generic message when nothing is available', () => {
        expect(formatDhis2Error(undefined)).toBe('An unexpected error occurred')
    })
})
