import { useMemo } from 'react'
import i18n from '@dhis2/d2-i18n'
import type { ProgramStageMetadata } from '@nnkogift/dhis2-form-utils-metadata'
import { resolveFormSectionLayout } from '@nnkogift/dhis2-form-utils-metadata'
import type { FieldControlInput } from '@nnkogift/dhis2-form-utils-hooks'
import { RuleAwareField } from '@/components/rules/RuleAwareField'
import { defaultSectionTitle, FormSectionCard } from './FormSectionCard'

type EventFormFieldsProps = {
    metadata: ProgramStageMetadata
}

function renderDataElementField(field: FieldControlInput | undefined) {
    if (!field) {
        return null
    }

    const fieldId =
        field.kind === 'dataElement' ? field.config.dataElement?.id : undefined
    if (!fieldId) {
        return null
    }

    return <RuleAwareField key={fieldId} field={field} />
}

export function EventFormFields({ metadata }: EventFormFieldsProps) {
    const programStageDataElements = metadata.programStageDataElements ?? []
    // Field prop objects are memoized per data element id so their reference stays
    // stable across renders unless the underlying metadata changes — required for
    // `React.memo` on `RuleAwareField` to actually bail out per-field.
    const fieldsByDataElementId = useMemo(
        () =>
            new Map<string, FieldControlInput>(
                programStageDataElements
                    .map((programStageDataElement) => {
                        const fieldId = programStageDataElement.dataElement?.id
                        if (!fieldId) {
                            return null
                        }

                        return [
                            fieldId,
                            {
                                kind: 'dataElement',
                                config: programStageDataElement,
                            },
                        ] as const
                    })
                    .filter(
                        (
                            entry
                        ): entry is readonly [string, FieldControlInput] =>
                            entry !== null
                    )
            ),
        [programStageDataElements]
    )

    const programStageSections = metadata.programStageSections ?? []

    if (programStageSections.length === 0) {
        return (
            <>
                {Array.from(fieldsByDataElementId.values()).map(
                    renderDataElementField
                )}
            </>
        )
    }

    const layout = useMemo(() => {
        return resolveFormSectionLayout({
            sections: programStageSections,
            fields: programStageDataElements,
            getSectionId: (section) => section.id,
            getSectionDisplayName: (section) => section.displayName,
            getSortOrder: (section) => section.sortOrder ?? 0,
            getSectionItemIds: (section) =>
                section.dataElements.map(({ id }: { id: string }) => id),
            getFieldId: (programStageDataElement) =>
                programStageDataElement.dataElement?.id,
        })
    }, [programStageSections, programStageDataElements])

    return (
        <>
            {layout.sections.map((section) => (
                <FormSectionCard
                    key={section.id}
                    sectionId={section.id}
                    title={defaultSectionTitle(section.displayName)}
                    note={i18n.t('{{count}} data elements', {
                        count: section.itemIds.length,
                    })}
                >
                    {section.itemIds.map((fieldId) =>
                        renderDataElementField(
                            fieldsByDataElementId.get(fieldId)
                        )
                    )}
                </FormSectionCard>
            ))}
            {layout.unsectionedItemIds.map((fieldId) =>
                renderDataElementField(fieldsByDataElementId.get(fieldId))
            )}
        </>
    )
}
