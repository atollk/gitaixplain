<script module lang="ts">
    import type { ModelName } from "$lib/models"

    type InputTypeMap = {
        "text": string
        "number": number
        "date": Date
        "checkbox": boolean
        "email": string
    };

    export type FormFields = {
        [fieldName: string]: {
            displayName: string
            validate?: (value: string) => boolean
            inputElementType: keyof InputTypeMap
        }
    }

    export const modelConfigFields: { [K in ModelName]: FormFields } = {
        Gemini: {
            apiKey: {
                displayName: "API Key",
                inputElementType: "text",
                validate: (value: string) => value.length > 0,
            },
        },
        Ollama: {
            contextWindowSize: {
                inputElementType: "number",
                displayName: "Context Window Size",
                validate: (value: string) => !isNaN(parseInt(value)),
            },
        },
    }

</script>

<script lang="ts">
    const { fields, config = $bindable() }: { fields: FormFields, config: { [fieldName: string]: any } } = $props()
</script>

<div>
    {#each Object.entries(fields) as [fieldName, field]}
        <div>
            <label>
                {field.displayName}
                <input type={field.inputElementType}
                       bind:value={ config[fieldName] }
                />
            </label>
        </div>
    {/each}
</div>