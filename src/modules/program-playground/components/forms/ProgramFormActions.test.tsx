import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { ProgramFormActions } from './ProgramFormActions'

function Wrapper({ children }: { children: ReactNode }) {
    const form = useForm()
    return <FormProvider {...form}>{children}</FormProvider>
}

describe('ProgramFormActions', () => {
    it('renders a single submit button by default', () => {
        render(
            <Wrapper>
                <ProgramFormActions submitLabel="Register" />
            </Wrapper>
        )

        expect(
            screen
                .getByRole('button', { name: 'Register' })
                .getAttribute('type')
        ).toBe('submit')
        expect(
            screen.queryByRole('button', { name: 'Trigger server rules' })
        ).toBeNull()
        expect(
            screen.queryByRole('button', { name: 'Trigger on-complete rules' })
        ).toBeNull()
    })

    it('calls the matching callback for Save and Complete', () => {
        const onSave = jest.fn()
        const onComplete = jest.fn()
        render(
            <Wrapper>
                <ProgramFormActions onSave={onSave} onComplete={onComplete} />
            </Wrapper>
        )

        fireEvent.click(
            screen.getByRole('button', { name: 'Trigger server rules' })
        )
        expect(onSave).toHaveBeenCalledTimes(1)
        expect(onComplete).not.toHaveBeenCalled()

        fireEvent.click(
            screen.getByRole('button', { name: 'Trigger on-complete rules' })
        )
        expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('verifies with the server from the form and keeps the button label', () => {
        const onVerify = jest.fn()
        const { rerender } = render(
            <Wrapper>
                <ProgramFormActions
                    submitLabel="Register"
                    serverCheck={{
                        state: { phase: 'idle' },
                        unplaced: [],
                        onVerify,
                    }}
                />
            </Wrapper>
        )

        fireEvent.click(
            screen.getByRole('button', { name: 'Verify with server' })
        )
        expect(onVerify).toHaveBeenCalledTimes(1)

        rerender(
            <Wrapper>
                <ProgramFormActions
                    submitLabel="Register"
                    serverCheck={{
                        state: {
                            phase: 'done',
                            report: {
                                verification: { entries: [] },
                                otherErrors: [],
                            },
                        },
                        unplaced: [],
                        onVerify,
                    }}
                />
            </Wrapper>
        )

        expect(
            screen.getByRole('button', { name: 'Verify with server' })
        ).toBeTruthy()
        expect(
            screen.getByText('Server found no rule errors or warnings.')
        ).toBeTruthy()
    })

    it('shows a failed server check in a notice', () => {
        render(
            <Wrapper>
                <ProgramFormActions
                    submitLabel="Register"
                    serverCheck={{
                        state: { phase: 'error', message: 'Network down' },
                        unplaced: [],
                        onVerify: jest.fn(),
                    }}
                />
            </Wrapper>
        )

        expect(screen.getByRole('alert').textContent).toContain('Network down')
    })

    it('validates without saving and confirms when the form is valid', async () => {
        const onSave = jest.fn()
        const onValidate = jest.fn().mockResolvedValue(true)
        render(
            <Wrapper>
                <ProgramFormActions
                    onSave={onSave}
                    onComplete={jest.fn()}
                    onValidate={onValidate}
                />
            </Wrapper>
        )

        fireEvent.click(screen.getByRole('button', { name: 'Validate form' }))

        await waitFor(() => {
            expect(screen.getByText('Form is valid')).toBeTruthy()
        })
        expect(onValidate).toHaveBeenCalledTimes(1)
        expect(onSave).not.toHaveBeenCalled()
    })

    it('announces the valid result as a status', async () => {
        render(
            <Wrapper>
                <ProgramFormActions
                    submitLabel="Register"
                    onValidate={jest.fn().mockResolvedValue(true)}
                />
            </Wrapper>
        )

        fireEvent.click(screen.getByRole('button', { name: 'Validate form' }))

        expect(await screen.findByRole('status')).toBeTruthy()
    })

    it('raises a focused alert listing the invalid fields', async () => {
        function InvalidWrapper({ children }: { children: ReactNode }) {
            const form = useForm({ errors: { abc: { type: 'required' } } })
            return <FormProvider {...form}>{children}</FormProvider>
        }
        render(
            <InvalidWrapper>
                <ProgramFormActions
                    submitLabel="Register"
                    onValidate={jest.fn().mockResolvedValue(false)}
                    resolveFieldLabel={() => 'First name'}
                />
            </InvalidWrapper>
        )

        fireEvent.click(screen.getByRole('button', { name: 'Validate form' }))

        const alert = await screen.findByRole('alert')
        expect(alert.textContent).toContain('Form has issues')
        expect(alert.textContent).toContain('First name')
        expect(screen.queryByText('Form is valid')).toBeNull()
        await waitFor(() => {
            expect(document.activeElement).toBe(alert)
        })
    })

    it('shows an alert instead of swallowing a validation failure', async () => {
        render(
            <Wrapper>
                <ProgramFormActions
                    submitLabel="Register"
                    onValidate={jest.fn().mockRejectedValue(new Error('boom'))}
                />
            </Wrapper>
        )

        fireEvent.click(screen.getByRole('button', { name: 'Validate form' }))

        const alert = await screen.findByRole('alert')
        expect(alert.textContent).toContain('boom')
    })
})
