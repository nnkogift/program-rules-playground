import { render, screen } from '@testing-library/react'
import {
    useFieldControl,
    useFieldRuleEffect,
    useFieldState,
} from '@nnkogift/dhis2-form-utils-hooks'
import { useWatch } from 'react-hook-form'
import { useProgramOrgUnitsContext } from '@/modules/program-playground/components/orgUnit/ProgramOrgUnitsContext'
import { RuleAwareField } from './RuleAwareField'
import { RuleDisplayProvider } from './RuleDisplayContext'

jest.mock('@nnkogift/dhis2-form-utils-hooks', () => ({
    useFieldControl: jest.fn(),
    useFieldRuleEffect: jest.fn(),
    useFieldState: jest.fn(),
}))
jest.mock('@nnkogift/dhis2-form-utils-dhis2-ui', () => ({
    D2FieldWidget: () => <input data-testid="d2-widget" />,
}))
jest.mock('react-hook-form', () => ({
    useWatch: jest.fn(),
}))
jest.mock(
    '@/modules/program-playground/components/orgUnit/ProgramOrgUnitsContext',
    () => ({
        useProgramOrgUnitsContext: jest.fn(),
    })
)
jest.mock(
    '@/modules/program-playground/components/orgUnit/OrgUnitSelectorField',
    () => ({
        OrgUnitSelectorField: () => <div data-testid="org-unit-selector" />,
    })
)
jest.mock('./FieldEffectBadge', () => ({
    FieldEffectBadge: ({ ruleName }: { ruleName: string }) => (
        <span data-testid="badge">{ruleName}</span>
    ),
}))
jest.mock('./HiddenFieldPlaceholder', () => ({
    HiddenFieldPlaceholder: ({ ruleName }: { ruleName: string }) => (
        <div data-testid="placeholder">{ruleName}</div>
    ),
}))

const mockedUseFieldControl = jest.mocked(useFieldControl)
const mockedUseFieldRuleEffect = jest.mocked(useFieldRuleEffect)
const mockedUseFieldState = jest.mocked(useFieldState)
const mockedUseWatch = jest.mocked(useWatch)
const mockedOrgUnitsContext = jest.mocked(useProgramOrgUnitsContext)

const labelLookup = {
    resolveRuleName: (ruleId: string) => `Rule ${ruleId}`,
    resolveFieldName: (fieldId: string) => fieldId,
}

function control(overrides: Record<string, unknown> = {}) {
    return {
        fieldId: 'field1',
        fieldConfig: { label: 'Weight' },
        isHidden: false,
        isMandatory: false,
        isDisabled: false,
        hasError: false,
        widgetKind: 'text',
        field: { value: '', onChange: jest.fn(), onBlur: jest.fn() },
        ...overrides,
    } as never
}

function renderField(ghostsEnabled = true) {
    return render(
        <RuleDisplayProvider
            ghostsEnabled={ghostsEnabled}
            labelLookup={labelLookup as never}
        >
            <RuleAwareField field={{} as never} />
        </RuleDisplayProvider>
    )
}

describe('RuleAwareField', () => {
    beforeEach(() => {
        mockedUseFieldControl.mockReturnValue(control())
        mockedUseFieldRuleEffect.mockReturnValue(undefined as never)
        mockedUseFieldState.mockReturnValue(undefined as never)
        mockedUseWatch.mockReturnValue('ACTIVE' as never)
        mockedOrgUnitsContext.mockReturnValue(null as never)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('renders the label and the widget', () => {
        renderField()

        expect(screen.getByText('Weight')).toBeTruthy()
        expect(screen.getByTestId('d2-widget')).toBeTruthy()
    })

    it('labels the rendered input via aria-labelledby', () => {
        renderField()

        expect(screen.getByLabelText('Weight')).toBe(
            screen.getByTestId('d2-widget')
        )
    })

    it('appends an asterisk to mandatory fields', () => {
        mockedUseFieldControl.mockReturnValue(control({ isMandatory: true }))

        renderField()

        expect(screen.getByText('Weight*')).toBeTruthy()
    })

    it('renders nothing for a hidden field when ghosts are disabled', () => {
        mockedUseFieldControl.mockReturnValue(control({ isHidden: true }))

        const { container } = renderField(false)

        expect(container.innerHTML).toBe('')
    })

    it('renders a placeholder naming the rule for a hidden field with ghosts', () => {
        mockedUseFieldControl.mockReturnValue(control({ isHidden: true }))
        mockedUseFieldRuleEffect.mockReturnValue({
            ruleId: 'r1',
            ruleActionType: 'HIDEFIELD',
        } as never)

        renderField()

        expect(screen.getByTestId('placeholder').textContent).toBe('Rule r1')
        expect(screen.queryByTestId('d2-widget')).toBeNull()
    })

    it('falls back to a generic rule name for hidden fields without an effect', () => {
        mockedUseFieldControl.mockReturnValue(control({ isHidden: true }))

        renderField()

        expect(screen.getByTestId('placeholder').textContent).toBe('a rule')
    })

    it('shows a badge when a rule affects the field', () => {
        mockedUseFieldRuleEffect.mockReturnValue({
            ruleId: 'r1',
            ruleActionType: 'SHOWWARNING',
        } as never)

        renderField()

        expect(screen.getByTestId('badge').textContent).toBe('Rule r1')
    })

    it('uses the org unit selector for org unit fields when org units are loaded', () => {
        mockedUseFieldControl.mockReturnValue(
            control({ widgetKind: 'orgUnit' })
        )
        mockedOrgUnitsContext.mockReturnValue({
            orgUnits: [],
            rootIds: [],
        } as never)

        renderField()

        expect(screen.getByTestId('org-unit-selector')).toBeTruthy()
        expect(screen.queryByTestId('d2-widget')).toBeNull()
    })

    it('falls back to the default widget for org unit fields without org units', () => {
        mockedUseFieldControl.mockReturnValue(
            control({ widgetKind: 'orgUnit' })
        )

        renderField()

        expect(screen.getByTestId('d2-widget')).toBeTruthy()
    })

    it('shows the on-complete error once the event is completed', () => {
        mockedUseWatch.mockReturnValue('COMPLETED' as never)
        mockedUseFieldState.mockReturnValue({
            errorOnComplete: 'Too heavy',
            warningOnComplete: 'Heavy',
        } as never)

        renderField()

        expect(screen.getByText('Too heavy')).toBeTruthy()
        expect(screen.queryByText('Heavy')).toBeNull()
        expect(screen.getByTestId('badge').textContent).toBe('completion pass')
    })

    it('shows the on-complete warning when there is no error', () => {
        mockedUseWatch.mockReturnValue('COMPLETED' as never)
        mockedUseFieldState.mockReturnValue({
            warningOnComplete: 'Heavy',
        } as never)

        renderField()

        expect(screen.getByText('Heavy')).toBeTruthy()
    })

    it('hides on-complete messages while the event is not completed', () => {
        mockedUseFieldState.mockReturnValue({
            errorOnComplete: 'Too heavy',
        } as never)

        renderField()

        expect(screen.queryByText('Too heavy')).toBeNull()
    })

    it('does not add a second badge when the rule effect is itself on-complete', () => {
        mockedUseWatch.mockReturnValue('COMPLETED' as never)
        mockedUseFieldRuleEffect.mockReturnValue({
            ruleId: 'r1',
            ruleActionType: 'ERRORONCOMPLETE',
        } as never)
        mockedUseFieldState.mockReturnValue({
            errorOnComplete: 'Too heavy',
        } as never)

        renderField()

        expect(screen.getAllByTestId('badge')).toHaveLength(1)
    })
})
