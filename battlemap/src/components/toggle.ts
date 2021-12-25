import * as wecco from "@weccoframework/core"

export interface ToggleSwitchData {
    label: wecco.ElementUpdate
    state?: boolean
    disabled?: boolean
    onChange?: (state: boolean) => void
}

export const ToggleSwitch = wecco.define("toggle-switch", (data: ToggleSwitchData, ctx: wecco.RenderContext): wecco.ElementUpdate => {
    data.state = data.state ?? false
    const onChange = () => {
        data.state = !data.state
        if (data.onChange) {
            data.onChange(data.state)
        }
        ctx.requestUpdate()
    }

    return wecco.html`<a href="#" ?disabled=${data.disabled} @click=${onChange}>${data.label} <i class="material-icons">toggle_${data.state ? "on" : "off"}</i></a>`
})