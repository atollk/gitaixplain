import { instance } from "@viz-js/viz"
import { default as Color } from "colorjs.io"
import mermaid from "mermaid"

export async function renderGraphviz(code: string | undefined): Promise<SVGElement> {
    if (code === undefined) return new Promise(() => {})
    else return (await instance()).renderSVGElement(code)
}

export function initMermaid() {
    const themeColors = extractThemeColorsFromDOM()
    const colorToHex = (colorString: string) => {
        const c = new Color(colorString)
        return c.to("srgb").toString({ format: "hex" })
    }
    mermaid.initialize({
        theme: "base",
        themeVariables: {
            primaryColor: colorToHex(themeColors.primary),
            primaryTextColor: colorToHex(themeColors.primaryContent),
            secondaryColor: colorToHex(themeColors.secondary),
            secondaryTextColor: colorToHex(themeColors.secondaryContent),
            tertiaryColor: colorToHex(themeColors.accent),
            tertiaryTextColor: colorToHex(themeColors.accentContent),
            background: colorToHex(themeColors.base100),
        },
        fontSize: 100,
    })
}

interface ThemeColors {
    primary: string
    primaryFocus: string
    primaryContent: string
    secondary: string
    secondaryFocus: string
    secondaryContent: string
    accent: string
    accentFocus: string
    accentContent: string
    neutral: string
    neutralFocus: string
    neutralContent: string
    base100: string
    base200: string
    base300: string
    baseContent: string
    info: string
    infoContent: string
    success: string
    successContent: string
    warning: string
    warningContent: string
    error: string
    errorContent: string
}

function extractThemeColorsFromDOM(): ThemeColors {
    const computedStyles = getComputedStyle(document.querySelector(":root")!)
    return {
        primary: `oklch(${computedStyles.getPropertyValue("--p")})`,
        primaryFocus: `oklch(${computedStyles.getPropertyValue("--pf")})`,
        primaryContent: `oklch(${computedStyles.getPropertyValue("--pc")})`,
        secondary: `oklch(${computedStyles.getPropertyValue("--s")})`,
        secondaryFocus: `oklch(${computedStyles.getPropertyValue("--sf")})`,
        secondaryContent: `oklch(${computedStyles.getPropertyValue("--sc")})`,
        accent: `oklch(${computedStyles.getPropertyValue("--a")})`,
        accentFocus: `oklch(${computedStyles.getPropertyValue("--af")})`,
        accentContent: `oklch(${computedStyles.getPropertyValue("--ac")})`,
        neutral: `oklch(${computedStyles.getPropertyValue("--n")})`,
        neutralFocus: `oklch(${computedStyles.getPropertyValue("--nf")})`,
        neutralContent: `oklch(${computedStyles.getPropertyValue("--nc")})`,
        base100: `oklch(${computedStyles.getPropertyValue("--b1")})`,
        base200: `oklch(${computedStyles.getPropertyValue("--b2")})`,
        base300: `oklch(${computedStyles.getPropertyValue("--b3")})`,
        baseContent: `oklch(${computedStyles.getPropertyValue("--bc")})`,
        info: `oklch(${computedStyles.getPropertyValue("--in")})`,
        infoContent: `oklch(${computedStyles.getPropertyValue("--inc")})`,
        success: `oklch(${computedStyles.getPropertyValue("--su")})`,
        successContent: `oklch(${computedStyles.getPropertyValue("--suc")})`,
        warning: `oklch(${computedStyles.getPropertyValue("--wa")})`,
        warningContent: `oklch(${computedStyles.getPropertyValue("--wac")})`,
        error: `oklch(${computedStyles.getPropertyValue("--er")})`,
        errorContent: `oklch(${computedStyles.getPropertyValue("--erc")})`,
    }
}
