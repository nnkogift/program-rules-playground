import { fireEvent, render, screen } from '@testing-library/react'
import { GhostToggleButton } from './GhostToggleButton'

describe('GhostToggleButton', () => {
    it('keeps one label and reports state with aria-pressed', () => {
        const { rerender } = render(
            <GhostToggleButton enabled onToggle={jest.fn()} />
        )
        const button = screen.getByRole('button', {
            name: 'Show hidden fields',
        })
        expect(button.getAttribute('aria-pressed')).toBe('true')

        rerender(<GhostToggleButton enabled={false} onToggle={jest.fn()} />)
        expect(
            screen
                .getByRole('button', { name: 'Show hidden fields' })
                .getAttribute('aria-pressed')
        ).toBe('false')
    })

    it('explains the feature in its tooltip and toggles on click', () => {
        const onToggle = jest.fn()
        render(<GhostToggleButton enabled onToggle={onToggle} />)
        const button = screen.getByRole('button', {
            name: 'Show hidden fields',
        })
        expect(button.getAttribute('title')).toBe(
            'Shows a placeholder where a rule hid a field or section.'
        )
        fireEvent.click(button)
        expect(onToggle).toHaveBeenCalledTimes(1)
    })
})
