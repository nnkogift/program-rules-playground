import { fireEvent, render, screen } from '@testing-library/react'
import { focusField } from '@/modules/program-playground/utils/focusField'
import { ServerCheckStatus } from './ServerCheckStatus'

jest.mock('@/modules/program-playground/utils/focusField', () => ({
    focusField: jest.fn(),
}))
jest.mock('./OtherImportErrors', () => ({
    OtherImportErrors: ({ errors }: { errors: string[] }) => (
        <div data-testid="other-errors">{errors.length}</div>
    ),
}))

function report(entries: unknown[] = [], otherErrors: unknown[] = []) {
    return {
        phase: 'done',
        report: { verification: { entries }, otherErrors },
    } as never
}

describe('ServerCheckStatus', () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    it('renders nothing while idle', () => {
        const { container } = render(
            <ServerCheckStatus state={{ phase: 'idle' }} unplaced={[]} />
        )

        expect(container.innerHTML).toBe('')
    })

    it('renders nothing while loading without a previous report', () => {
        const { container } = render(
            <ServerCheckStatus state={{ phase: 'loading' }} unplaced={[]} />
        )

        expect(container.innerHTML).toBe('')
    })

    it('shows the failure message', () => {
        render(
            <ServerCheckStatus
                state={{ phase: 'error', message: 'Network down' }}
                unplaced={[]}
            />
        )

        expect(screen.getByRole('alert')).toBeTruthy()
        expect(screen.getByText('Network down')).toBeTruthy()
    })

    it('shows a pass when the server reported nothing', () => {
        render(<ServerCheckStatus state={report()} unplaced={[]} />)

        expect(screen.getByRole('status')).toBeTruthy()
        expect(screen.getByText('Server check passed')).toBeTruthy()
    })

    it('points at the form when every issue sits on a field', () => {
        render(
            <ServerCheckStatus
                state={report([{ ruleId: 'r1', message: 'Bad' }])}
                unplaced={[]}
            />
        )

        expect(
            screen.getByText('The affected fields are highlighted in the form.')
        ).toBeTruthy()
    })

    it('lists unplaced entries and focuses the targeted field', () => {
        const entry = { ruleId: 'r1', message: 'Too high', targetId: 'f1' }
        render(
            <ServerCheckStatus
                state={report([entry])}
                unplaced={[entry] as never}
                resolveFieldLabel={() => 'Weight'}
            />
        )

        fireEvent.click(screen.getByText('Weight'))

        expect(focusField).toHaveBeenCalledWith('f1')
        expect(screen.getByText('Too high', { exact: false })).toBeTruthy()
    })

    it('falls back to the field id and handles entries without a target', () => {
        const targeted = { ruleId: 'r1', message: 'A', targetId: 'f1' }
        const untargeted = { ruleId: 'r2', message: 'B' }
        render(
            <ServerCheckStatus
                state={report([targeted, untargeted])}
                unplaced={[targeted, untargeted] as never}
            />
        )

        expect(screen.getByText('f1')).toBeTruthy()
        expect(screen.getAllByRole('button')).toHaveLength(1)
    })

    it('passes other import errors on', () => {
        render(
            <ServerCheckStatus
                state={report([], ['Something else'])}
                unplaced={[]}
            />
        )

        expect(screen.getByTestId('other-errors').textContent).toBe('1')
    })
})
