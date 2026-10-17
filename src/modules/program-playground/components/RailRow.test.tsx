import { fireEvent, render, screen } from '@testing-library/react'
import { RailRow } from './RailRow'

function renderRow(props: Partial<Parameters<typeof RailRow>[0]> = {}) {
    const onClick = jest.fn()
    render(
        <RailRow
            label="Registration"
            meta="3 fields"
            selected={false}
            onClick={onClick}
            {...props}
        />
    )
    return { onClick, row: screen.getByRole('button') }
}

describe('RailRow', () => {
    it('renders the label and meta', () => {
        renderRow()

        expect(screen.getByText('Registration')).toBeTruthy()
        expect(screen.getByText('3 fields')).toBeTruthy()
    })

    it('marks the selected row as current', () => {
        const { row } = renderRow({ selected: true })

        expect(row.getAttribute('aria-current')).toBe('true')
    })

    it('does not mark an unselected row as current', () => {
        const { row } = renderRow()

        expect(row.getAttribute('aria-current')).toBeNull()
    })

    it('calls onClick on click', () => {
        const { onClick, row } = renderRow()

        fireEvent.click(row)

        expect(onClick).toHaveBeenCalledTimes(1)
    })

    it.each(['Enter', ' '])('calls onClick on the %j key', (key) => {
        const { onClick, row } = renderRow()

        fireEvent.keyDown(row, { key })

        expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('ignores other keys', () => {
        const { onClick, row } = renderRow()

        fireEvent.keyDown(row, { key: 'a' })

        expect(onClick).not.toHaveBeenCalled()
    })

    it('renders the icon and action when given', () => {
        renderRow({
            icon: <i data-testid="icon" />,
            action: <b data-testid="action" />,
        })

        expect(screen.getByTestId('icon')).toBeTruthy()
        expect(screen.getByTestId('action')).toBeTruthy()
    })
})
