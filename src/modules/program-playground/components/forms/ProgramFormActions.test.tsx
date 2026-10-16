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
                <ProgramFormActions submitLabel="Register" errorTitle="Error" />
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
                <ProgramFormActions
                    onSave={onSave}
                    onComplete={onComplete}
                    errorTitle="Error"
                />
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

    it('shows the success notice', () => {
        render(
            <Wrapper>
                <ProgramFormActions
                    onSave={jest.fn()}
                    onComplete={jest.fn()}
                    errorTitle="Error"
                    successTitle="Event completed"
                    successMessage="Event completed successfully"
                />
            </Wrapper>
        )

        expect(screen.getByText('Event completed successfully')).toBeTruthy()
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
                    errorTitle="Error"
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

    it('stays quiet when validation fails, leaving errors on the fields', async () => {
        render(
            <Wrapper>
                <ProgramFormActions
                    submitLabel="Register"
                    onValidate={jest.fn().mockResolvedValue(false)}
                    errorTitle="Error"
                />
            </Wrapper>
        )

        fireEvent.click(screen.getByRole('button', { name: 'Validate form' }))

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: 'Validate form' })
            ).toBeTruthy()
        })
        expect(screen.queryByText('Form is valid')).toBeNull()
    })
})
