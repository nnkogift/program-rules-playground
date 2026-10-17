import { validateForm } from './validateForm'

const formWith = (invoke: (onValid: () => void) => void) => ({
    handleSubmit: (onValid: () => void) => async () => {
        invoke(onValid)
    },
})

describe('validateForm', () => {
    it('resolves true when the submit handler runs', async () => {
        const form = formWith((onValid) => onValid())
        await expect(validateForm(form as never)).resolves.toBe(true)
    })

    it('resolves false when validation blocks the submit handler', async () => {
        const form = formWith(() => undefined)
        await expect(validateForm(form as never)).resolves.toBe(false)
    })
})
