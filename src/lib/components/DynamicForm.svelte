<script lang="ts">
    type BaseType = "string" | "integer" | "float" | "boolean" | "date" | "enum";

    interface EnumOption {
        value: string | number;
        label: string;
    }

    interface FieldDefinition {
        name: string;
        type: BaseType;
        label?: string;
        required?: boolean;
        defaultValue?: any;
        options?: EnumOption[];
        min?: number;
        max?: number;
        step?: number;
    }

    interface Props {
        fieldDefinition: FieldDefinition[];
        initialData?: Record<string, any>;
    }

    let { fields, initialData = {} }: Props = $props()
    const formData = signal<Record<string, any>>({ ...initialData })

    // Derive validation status for each field
    const fieldValidity = derive(() => {
        const validity: Record<string, boolean> = {}

        fields.forEach(field => {
            const value = formData.value[field.name]
            validity[field.name] = true // Default to valid

            if (field.required && (value === undefined || value === "")) {
                validity[field.name] = false
            }

            if (value !== undefined && value !== "") {
                switch (field.type) {
                    case "integer":
                        validity[field.name] = Number.isInteger(value) &&
                            (!field.min || value >= field.min) &&
                            (!field.max || value <= field.max)
                        break
                    case "float":
                        validity[field.name] = typeof value === "number" &&
                            (!field.min || value >= field.min) &&
                            (!field.max || value <= field.max)
                        break
                    case "enum":
                        validity[field.name] = field.options?.some(opt => opt.value === value) ?? true
                        break
                }
            }
        })

        return validity
    })

    // Convert values and emit changes
    function handleChange(event: Event, field: FieldDefinition) {
        const target = event.target as HTMLInputElement
        let value: any

        switch (field.type) {
            case "integer":
                value = target.value ? parseInt(target.value) : null
                break
            case "float":
                value = target.value ? parseFloat(target.value) : null
                break
            case "boolean":
                value = target.checked
                break
            case "date":
                value = target.value ? new Date(target.value) : null
                break
            case "enum":
                value = target.value
                if (field.options?.[0]?.value typeof === "number"
            )
            {
                value = Number(value)
            }
                break
            default:
                value = target.value
        }

        formData.update(data => {
            const newData = { ...data, [field.name]: value }
            // Emit the update event with the new data
            const event = new CustomEvent("update", {
                detail: {
                    data: newData,
                    validity: fieldValidity.value,
                },
            })
            document.dispatchEvent(event)
            return newData
        })
    }
</script>

<div class="space-y-4">
    {#each fields as field}
        <div class="flex flex-col gap-2">
            <label for={field.name} class="font-medium text-gray-700">
                {field.label || field.name}
                {#if field.required}
                    <span class="text-red-500">*</span>
                {/if}
            </label>

            {#if field.type === "boolean"}
                <label class="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id={field.name}
                        class="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                        checked={$formData[field.name] ?? field.defaultValue ?? false}
                        on:change={(e) => handleChange(e, field)}
                    />
                    <span class="text-sm text-gray-600">
                        {field.label || field.name}
                    </span>
                </label>
            {:else if field.type === "enum"}
                <select
                    id={field.name}
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={$formData[field.name] ?? field.defaultValue ?? ""}
                    on:change={(e) => handleChange(e, field)}
                >
                    <option value="">Select {field.label || field.name}</option>
                    {#each field.options || [] as option}
                        <option value={option.value}>
                            {option.label}
                        </option>
                    {/each}
                </select>
            {:else if field.type === "float" || field.type === "integer"}
                <input
                    type="number"
                    id={field.name}
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={$formData[field.name] ?? field.defaultValue ?? ""}
                    min={field.min}
                    max={field.max}
                    step={field.type === "float" ? (field.step ?? "any") : 1}
                    on:input={(e) => handleChange(e, field)}
                />
            {:else}
                <input
                    type={field.type === "date" ? "date" : "text"}
                    id={field.name}
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={$formData[field.name] ?? field.defaultValue ?? ""}
                    on:input={(e) => handleChange(e, field)}
                />
            {/if}

            {#if !$fieldValidity[field.name]}
                <p class="text-sm text-red-500">This field is invalid</p>
            {/if}
        </div>
    {/each}
</div>
