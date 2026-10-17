import { listRenderableStageSlots } from './listRenderableStageSlots'

describe('listRenderableStageSlots', () => {
    it('returns nothing without stages', () => {
        expect(listRenderableStageSlots(undefined, {})).toEqual([])
    })

    it('gives a non-repeatable stage one primary slot', () => {
        expect(listRenderableStageSlots([{ id: 's1' }], {})).toEqual([
            { stageId: 's1', eventLocalId: 'primary' },
        ])
    })

    it('gives a repeatable stage one slot per draft event', () => {
        expect(
            listRenderableStageSlots([{ id: 's1', repeatable: true }], {
                s1: ['e1', 'e2'],
            })
        ).toEqual([
            { stageId: 's1', eventLocalId: 'e1' },
            { stageId: 's1', eventLocalId: 'e2' },
        ])
    })

    it('gives a repeatable stage without drafts no slots', () => {
        expect(
            listRenderableStageSlots([{ id: 's1', repeatable: true }], {})
        ).toEqual([])
    })

    it('skips stages without an id and keeps stage order', () => {
        expect(
            listRenderableStageSlots(
                [{ id: 's1' }, {}, { id: 's2', repeatable: true }],
                { s2: ['e1'] }
            )
        ).toEqual([
            { stageId: 's1', eventLocalId: 'primary' },
            { stageId: 's2', eventLocalId: 'e1' },
        ])
    })
})
