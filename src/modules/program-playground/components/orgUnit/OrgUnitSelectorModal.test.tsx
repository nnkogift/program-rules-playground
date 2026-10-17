import { fireEvent, render, screen } from '@testing-library/react'
import { OrgUnitSelectorModal } from './OrgUnitSelectorModal'

jest.mock('@dhis2/ui', () => ({
    Modal: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    ModalTitle: ({ children }: { children: React.ReactNode }) => (
        <h1>{children}</h1>
    ),
    ModalContent: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    ModalActions: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    ButtonStrip: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    Button: ({
        children,
        onClick,
        disabled,
    }: {
        children: React.ReactNode
        onClick?: () => void
        disabled?: boolean
    }) => (
        <button onClick={onClick} disabled={disabled}>
            {children}
        </button>
    ),
    InputField: ({
        value,
        onChange,
    }: {
        value: string
        onChange: (payload: { value?: string }) => void
    }) => (
        <input
            aria-label="search"
            value={value}
            onChange={(event) => {
                onChange({ value: event.target.value })
            }}
        />
    ),
    OrganisationUnitTree: ({
        filter,
        onChange,
    }: {
        filter: string[]
        onChange: (payload: { id: string; path: string }) => void
    }) => (
        <div data-testid="tree" data-filter={filter.join(',')}>
            <button
                onClick={() => {
                    onChange({ id: 'a', path: '/a' })
                }}
            >
                pick-a
            </button>
            <button
                onClick={() => {
                    onChange({ id: 'unassigned', path: '/x' })
                }}
            >
                pick-unassigned
            </button>
        </div>
    ),
}))

const orgUnits = [
    { id: 'a', displayName: 'Alpha', path: '/a' },
    { id: 'b', displayName: 'Bravo', path: '/b' },
]

function renderModal(value = '') {
    const onSelect = jest.fn()
    const onClose = jest.fn()
    render(
        <OrgUnitSelectorModal
            orgUnits={orgUnits}
            rootIds={['a', 'b']}
            value={value}
            onSelect={onSelect}
            onClose={onClose}
        />
    )
    return { onSelect, onClose }
}

describe('OrgUnitSelectorModal', () => {
    it('disables Select until an org unit is picked', () => {
        renderModal()

        const select = screen.getByText('Select') as HTMLButtonElement
        expect(select.disabled).toBe(true)
    })

    it('names the picked org unit on the confirm button and selects it', () => {
        const { onSelect, onClose } = renderModal()

        fireEvent.click(screen.getByText('pick-a'))
        fireEvent.click(screen.getByText('Select Alpha'))

        expect(onSelect).toHaveBeenCalledWith('a')
        expect(onClose).toHaveBeenCalled()
    })

    it('starts with the current value pending', () => {
        renderModal('b')

        expect(screen.getByText('Select Bravo')).toBeTruthy()
    })

    it('ignores org units not assigned to the program', () => {
        renderModal()

        fireEvent.click(screen.getByText('pick-unassigned'))

        expect((screen.getByText('Select') as HTMLButtonElement).disabled).toBe(
            true
        )
    })

    it('narrows the tree to search matches', () => {
        renderModal()

        fireEvent.change(screen.getByLabelText('search'), {
            target: { value: 'bra' },
        })

        expect(screen.getByTestId('tree').getAttribute('data-filter')).toBe(
            '/b'
        )
    })

    it('says so when nothing matches the search', () => {
        renderModal()

        fireEvent.change(screen.getByLabelText('search'), {
            target: { value: 'zzz' },
        })

        expect(screen.getByText('No matching organisation units')).toBeTruthy()
        expect(screen.queryByTestId('tree')).toBeNull()
    })

    it('closes on Cancel without selecting', () => {
        const { onSelect, onClose } = renderModal()

        fireEvent.click(screen.getByText('Cancel'))

        expect(onClose).toHaveBeenCalled()
        expect(onSelect).not.toHaveBeenCalled()
    })
})
