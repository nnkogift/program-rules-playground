import { buildActionTypesByRule } from './buildActionTypesByRule'

describe('buildActionTypesByRule', () => {
    it('maps rule ids to their action types', () => {
        const result = buildActionTypesByRule([
            {
                id: 'r1',
                programRuleActions: [
                    { programRuleActionType: 'HIDEFIELD' },
                    { programRuleActionType: 'SHOWWARNING' },
                ],
            },
        ])

        expect(result.get('r1')).toEqual(['HIDEFIELD', 'SHOWWARNING'])
    })

    it('treats a rule without actions as having none', () => {
        expect(buildActionTypesByRule([{ id: 'r1' }]).get('r1')).toEqual([])
    })

    it('skips rules without an id', () => {
        const result = buildActionTypesByRule([
            { programRuleActions: [{ programRuleActionType: 'HIDEFIELD' }] },
        ])

        expect(result.size).toBe(0)
    })
})
