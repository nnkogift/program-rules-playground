import { useMemo } from 'react'
import i18n from '@dhis2/d2-i18n'
import type {
    FieldControlInput,
    TrackerProgramMetadata,
} from '@nnkogift/dhis2-form-utils-hooks'
import type { ProgramTrackedEntityAttribute } from '@nnkogift/dhis2-form-utils-metadata'
import { resolveFormSectionLayout } from '@nnkogift/dhis2-form-utils-metadata'
import { RuleAwareField } from '@/components/rules/RuleAwareField'
import { defaultSectionTitle, FormSectionCard } from './FormSectionCard'

type RegistrationFormFieldsProps = {
    metadata: TrackerProgramMetadata
}

function toFieldConfig(
    attribute: TrackerProgramMetadata['programTrackedEntityAttributes'][number]
): ProgramTrackedEntityAttribute {
    return {
        ...attribute,
        trackedEntityAttribute: {
            ...attribute.trackedEntityAttribute,
            displayFormName:
                attribute.trackedEntityAttribute.formName ??
                attribute.trackedEntityAttribute.displayName,
        },
    } as unknown as ProgramTrackedEntityAttribute
}

function renderTeaField(field: FieldControlInput | undefined) {
    if (!field || field.kind !== 'trackedEntityAttribute') {
        return null
    }

    return <RuleAwareField key={field.config.id} field={field} />
}

export function RegistrationFormFields({
    metadata,
}: RegistrationFormFieldsProps) {
    const fieldConfigs = useMemo(
        () =>
            metadata.programTrackedEntityAttributes
                .slice()
                .sort(
                    (left, right) =>
                        (left.sortOrder ?? 0) - (right.sortOrder ?? 0)
                )
                .map(toFieldConfig),
        [metadata.programTrackedEntityAttributes]
    )
    const sections = metadata.programSections ?? []
    // Field prop objects are memoized per TEA id so their reference stays stable
    // across renders unless the underlying metadata changes — required for
    // `React.memo` on `RuleAwareField` to actually bail out per-field.
    const fieldsByTeaId = useMemo(
        () =>
            new Map<string, FieldControlInput>(
                fieldConfigs.map((fieldConfig) => [
                    fieldConfig.trackedEntityAttribute.id,
                    {
                        kind: 'trackedEntityAttribute',
                        config: fieldConfig,
                    },
                ])
            ),
        [fieldConfigs]
    )

    if (sections.length === 0) {
        return <>{Array.from(fieldsByTeaId.values()).map(renderTeaField)}</>
    }

    const layout = resolveFormSectionLayout({
        sections,
        fields: fieldConfigs,
        getSectionId: (section) => section.id,
        getSectionDisplayName: (section) => section.displayName,
        getSortOrder: (section) => section.sortOrder ?? 0,
        getSectionItemIds: (section) => {
            return section.trackedEntityAttributes.map(
                (attribute) => attribute.id
            )
        },
        getFieldId: (fieldConfig) => fieldConfig.trackedEntityAttribute.id,
    })

    return (
        <>
            {layout.sections.map((section) => (
                <FormSectionCard
                    key={section.id}
                    sectionId={section.id}
                    title={defaultSectionTitle(section.displayName)}
                    note={i18n.t('{{count}} attributes', {
                        count: section.itemIds.length,
                    })}
                >
                    {section.itemIds.map((teaId) =>
                        renderTeaField(fieldsByTeaId.get(teaId))
                    )}
                </FormSectionCard>
            ))}
            {layout.unsectionedItemIds.map((teaId) =>
                renderTeaField(fieldsByTeaId.get(teaId))
            )}
        </>
    )
}
