import { render, screen } from '@testing-library/react'
import { ProgramRuleActionType } from '@nnkogift/dhis2-form-utils-metadata'
import { FieldEffectBadge } from './FieldEffectBadge'

jest.mock(
    '@nnkogift/dhis2-form-utils-devtools/effect-styles',
    () => ({
        EFFECT_ICONS: { hide: () => <svg />, error: () => <svg /> },
        getEffectVariant: (actionType: string) =>
            actionType === 'HIDEFIELD' ? 'hide' : 'error',
        getEffectVisual: () => ({ shortLabel: 'Fallback', tagClassName: '' }),
    }),
    { virtual: true }
)

describe('FieldEffectBadge', () => {
    it('labels a hide effect and names the rule in the title', () => {
        render(
            <FieldEffectBadge
                actionType={ProgramRuleActionType.HIDEFIELD}
                ruleName="Hide weight"
            />
        )

        const badge = screen.getByText('Hidden')
        expect(badge.getAttribute('title')).toContain('Hide weight')
        expect(badge.getAttribute('data-on-complete')).toBeNull()
    })

    it('prefixes on-complete outcomes and flags them', () => {
        render(
            <FieldEffectBadge
                onComplete
                actionType={ProgramRuleActionType.ERRORONCOMPLETE}
                ruleName="Check weight"
            />
        )

        const badge = screen.getByText('On complete: error')
        expect(badge.getAttribute('data-on-complete')).toBe('true')
    })
})
