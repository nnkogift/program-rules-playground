import { render, screen } from '@testing-library/react'
import { ProgramRegistrationFormScreen } from './ProgramRegistrationFormScreen'

jest.mock('../trackerFormsStoreContext', () => ({
    useTrackerFormsStore: () => [],
}))
jest.mock('./ProgramRegistrationForm', () => ({
    ProgramRegistrationForm: () => <div data-testid="form" />,
}))

function renderScreen(props: Record<string, unknown> = {}) {
    return render(
        <ProgramRegistrationFormScreen
            programId="p1"
            orgUnitId="ou1"
            enrolledAt="2024-01-01"
            metadata={
                { programTrackedEntityAttributes: [{ id: 'a' }] } as never
            }
            programStages={[]}
            loading={false}
            error={undefined}
            {...(props as object)}
        />
    )
}

describe('ProgramRegistrationFormScreen', () => {
    it('shows a loader while loading', () => {
        renderScreen({ loading: true })

        expect(screen.queryByTestId('form')).toBeNull()
        expect(
            screen.queryByText('Could not load registration form')
        ).toBeNull()
    })

    it('shows an error notice when loading failed', () => {
        renderScreen({ error: new Error('boom') })

        expect(
            screen.getByText('Could not load registration form')
        ).toBeTruthy()
    })

    it('shows an error notice when metadata is missing', () => {
        renderScreen({ metadata: undefined })

        expect(
            screen.getByText('Could not load registration form')
        ).toBeTruthy()
    })

    it('explains when the program has no attributes', () => {
        renderScreen({ metadata: { programTrackedEntityAttributes: [] } })

        expect(screen.getByText('No attributes configured')).toBeTruthy()
        expect(screen.queryByTestId('form')).toBeNull()
    })

    it('renders the registration form once metadata is loaded', () => {
        renderScreen()

        expect(screen.getByTestId('form')).toBeTruthy()
    })
})
