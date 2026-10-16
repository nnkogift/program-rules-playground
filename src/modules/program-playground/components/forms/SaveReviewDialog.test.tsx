import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { SaveReviewDialog } from './SaveReviewDialog'

const mockMutate = jest.fn()
const mockShowAlert = jest.fn()

jest.mock('@dhis2/app-runtime', () => ({
    useDataEngine: () => ({ mutate: mockMutate }),
    useAlert: () => ({ show: mockShowAlert }),
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
            confirmLabel="Trigger server rules"
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
        mockShowAlert.mockReset()
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

        expect(
            await screen.findByText('Other import errors (1)')
        ).not.toBeNull()
    })

    it('reports a clean server check and offers to verify again', async () => {
        mockMutate.mockResolvedValue({})
        renderDialog()

        fireEvent.click(screen.getByText('Verify with server'))

        expect(
            await screen.findByText('Server found no rule errors or warnings.')
        ).not.toBeNull()
        expect(screen.getByText('Verify again')).not.toBeNull()
    })

    it('raises an alert instead of a footer notice when verification fails', async () => {
        mockMutate.mockRejectedValue(new Error('Network down'))
        renderDialog()

        fireEvent.click(screen.getByText('Verify with server'))

        await waitFor(() => {
            expect(mockShowAlert).toHaveBeenCalledWith('Network down')
        })
        expect(screen.queryByText('Could not verify with server')).toBeNull()
    })
})
