import { listMandatoryFieldIds } from './listMandatoryFieldIds'

describe('listMandatoryFieldIds', () => {
    it('returns only compulsory data elements with an id', () => {
        expect(
            listMandatoryFieldIds({
                programStageDataElements: [
                    { compulsory: true, dataElement: { id: 'de1' } },
                    { compulsory: false, dataElement: { id: 'de2' } },
                    { compulsory: true, dataElement: {} },
                    { compulsory: true },
                    { dataElement: { id: 'de3' } },
                ],
            })
        ).toEqual(['de1'])
    })

    it('returns nothing for a stage without data elements', () => {
        expect(listMandatoryFieldIds({})).toEqual([])
    })
})
