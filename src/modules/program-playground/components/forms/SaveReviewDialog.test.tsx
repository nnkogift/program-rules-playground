import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { SaveReviewDialog } from './SaveReviewDialog'

const mockMutate = jest.fn()

jest.mock('@dhis2/app-runtime', () => ({
    useDataEngine: () => ({ mutate: mockMutate }),
}))

jest.mock('@nnkogift/dhis2-form-utils-devtools', () => ({
    ServerEffectsSummary: ({ footer }: { footer: ReactNode }) => (
        <div>{footer}</div>
    ),
}))

const payload = { events: [{ program: 'p1' }] }

const renderDialog = () =>
    render(
        <SaveReviewDialog
            formStore={{ subscribeTrace: () => () => undefined } as never}
            status="ACTIVE"
            programId="p1"
            values={{}}
            labelLookup={{} as never}
            buildPayload={() => payload}
            actionTypesByRule={new Map()}
            onCancel={jest.fn()}
            onConfirm={jest.fn()}
        />
    )

describe('SaveReviewDialog', () => {
    beforeEach(() => {
        mockMutate.mockReset()
    })

    it('does not run the dry run on open', () => {
        renderDialog()

        expect(mockMutate).not.toHaveBeenCalled()
    })

    it('posts the save payload in VALIDATE mode when verifying', async () => {
        mockMutate.mockResolvedValue({})
        renderDialog()

        fireEvent.click(screen.getByText('Verify with server'))

        await waitFor(() => {
            expect(mockMutate).toHaveBeenCalledWith({
                resource: 'tracker',
                type: 'create',
                params: { importMode: 'VALIDATE', async: false },
                data: payload,
            })
        })
    })

    it('lists importer errors no rule generated', async () => {
        mockMutate.mockRejectedValue({
            details: {
                response: {
                    validationReport: {
                        errorReports: [
                            { errorCode: 'E1302', message: 'Invalid value' },
                        ],
                    },
                },
            },
        })
        renderDialog()

        fireEvent.click(screen.getByText('Verify with server'))

        expect(await screen.findByText('Other import errors')).not.toBeNull()
    })
})
