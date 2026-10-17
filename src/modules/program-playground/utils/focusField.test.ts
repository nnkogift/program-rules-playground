import { focusField } from './focusField'

describe('focusField', () => {
    beforeEach(() => {
        Element.prototype.scrollIntoView = jest.fn()
        document.body.innerHTML =
            '<div data-field-id="abc"><input id="x" /></div>'
    })

    it('scrolls to and focuses the field control', () => {
        expect(focusField('abc')).toBe(true)
        expect(document.activeElement?.id).toBe('x')
        expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
    })

    it('returns false for a field that is not rendered', () => {
        expect(focusField('missing')).toBe(false)
    })
})
