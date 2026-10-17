import { omitUndefined } from './omitUndefined'

describe('omitUndefined', () => {
    it('drops undefined values and keeps everything else', () => {
        expect(
            omitUndefined({ a: 1, b: undefined, c: null, d: '', e: false })
        ).toEqual({ a: 1, c: null, d: '', e: false })
    })

    it('does not mutate its input', () => {
        const input = { a: undefined }

        omitUndefined(input)

        expect('a' in input).toBe(true)
    })
})
