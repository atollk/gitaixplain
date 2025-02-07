<script module lang="ts">
    type InferInputType<T> = T extends string
        ? "text" | "email"
        : T extends number
            ? "number"
            : T extends boolean
                ? "checkbox"
                : T extends Date
                    ? "date"
                    : never;

    export type FormFields<T> = {
        [K in keyof T]: {
            displayName: string;
            validate?: (value: string) => boolean;
            inputElementType: InferInputType<T[K]>;
        }
    };
</script>

<script lang="ts" generics="T extends object">
    import type { AiInterface } from "$lib/backend/ai_backend"

    const { model }: { model: AiInterface<T> } = $props()
    const fieldNames = $derived(Object.keys(model.config) as Array<keyof T>)

    function onInput(element: HTMLInputElement, fieldName: keyof T) {
        model.config[fieldName] = (element.value as T[keyof T])
    }
</script>

<div>
    {#each fieldNames as fieldName}
        <div>
            <label>
                {model.getConfigFormFields()[fieldName].displayName}
                <input type={model.getConfigFormFields()[fieldName].inputElementType}
                       oninput={(event) => onInput(event.currentTarget, fieldName)} />
            </label>
        </div>
    {/each}
</div>