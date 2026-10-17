import { fireEvent, render, screen } from '@testing-library/react'
import { EnrollmentRail } from './EnrollmentRail'
import { TrackerFormsStoreProvider } from './trackerFormsStoreContext'

jest.mock('./RepeatableStageGroup', () => ({
    RepeatableStageGroup: ({
        stageDisplayName,
    }: {
        stageDisplayName: string
    }) => <div data-testid="repeatable">{stageDisplayName}</div>,
}))

const program = {
    programStages: [
        { id: 's2', displayName: 'Follow-up', sortOrder: 2 },
        { id: 's1', displayName: 'Intake', sortOrder: 1 },
        { id: 's3', displayName: 'Visits', sortOrder: 3, repeatable: true },
        { displayName: 'No id' },
    ],
} as never

function renderRail(trackerMetadata?: unknown) {
    return render(
        <TrackerFormsStoreProvider>
            <EnrollmentRail
                program={program}
                trackerMetadata={trackerMetadata as never}
            />
        </TrackerFormsStoreProvider>
    )
}

describe('EnrollmentRail', () => {
    it('lists registration then stages in sort order, skipping stages without an id', () => {
        renderRail()

        const labels = screen
            .getAllByRole('button')
            .map((button) => button.textContent)

        expect(labels[0]).toContain('Registration')
        expect(labels[1]).toContain('Intake')
        expect(labels[2]).toContain('Follow-up')
        expect(screen.queryByText('No id')).toBeNull()
    })

    it('renders repeatable stages as a group', () => {
        renderRail()

        expect(screen.getByTestId('repeatable').textContent).toBe('Visits')
    })

    it('counts registration attributes', () => {
        renderRail({ programTrackedEntityAttributes: [{}, {}, {}] })

        expect(screen.getByText('3 attributes')).toBeTruthy()
    })

    it('selects a row when clicked', () => {
        renderRail()
        const intake = screen.getByText('Intake').closest('[role="button"]')!

        expect(intake.getAttribute('aria-current')).toBeNull()
        fireEvent.click(intake)

        expect(intake.getAttribute('aria-current')).toBe('true')
    })
})
