import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { SaveReviewDialog } from './SaveReviewDialog'

jest.mock('@nnkogift/dhis2-form-utils-devtools', () => ({
    ServerEffectsSummary: ({ footer }: { footer: ReactNode }) => (
        <div>{footer}</div>
    ),
}))

const renderDialog = (serverReport?: { entries: [] }) =>
    render(
        <SaveReviewDialog
            formStore={{ subscribeTrace: () => () => undefined } as never}
            programId="p1"
            values={{}}
            labelLookup={{} as never}
            serverReport={serverReport}
            onClose={jest.fn()}
        />
    )

describe('SaveReviewDialog', () => {
    it('has no verify or confirm actions', () => {
        renderDialog()

        expect(screen.queryByText('Verify with server')).toBeNull()
        expect(screen.queryByText('Preview server effects')).toBeNull()
    })

    it('points at the form until a server check has run', () => {
        renderDialog()

        expect(
            screen.getByText(
                'Use Verify with server on the form to compare against the server.'
            )
        ).not.toBeNull()
    })

    it('explains the dry-run caveat once a server check is shown', () => {
        renderDialog({ entries: [] })

        expect(
            screen.getByText(/notification rows stay Simulated/)
        ).not.toBeNull()
    })
})
