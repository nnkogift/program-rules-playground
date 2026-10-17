import { applyServerReport } from './applyServerReport'

const entry = (overrides: Record<string, unknown>) => ({
    ruleId: 'r1',
    actionType: 'SHOWERROR',
    level: 'ERROR' as const,
    message: 'Bad value',
    ...overrides,
})

describe('applyServerReport', () => {
    it('sets targeted errors on rendered fields and returns the rest', () => {
        const setError = jest.fn()
        const onScreen = entry({ targetId: 'deA' })
        const offScreen = entry({ targetId: 'deB' })
        const untargeted = entry({})
        const warning = entry({ targetId: 'deA', level: 'WARNING' })

        const unplaced = applyServerReport(
            { setError },
            { entries: [onScreen, offScreen, untargeted, warning] },
            { isFieldRendered: (id) => id === 'deA' }
        )

        expect(setError).toHaveBeenCalledTimes(1)
        expect(setError).toHaveBeenCalledWith('deA', {
            type: 'server',
            message: 'Bad value',
        })
        expect(unplaced).toEqual([offScreen, untargeted, warning])
    })
})
