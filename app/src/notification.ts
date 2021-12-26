import * as wecco from "@weccoframework/core"

const ShowNotificationTime = 5000

export interface NotificationOpts {
    content: wecco.ElementUpdate
    style?: "info" | "error"
}

function isOpts(input: wecco.ElementUpdate | NotificationOpts): input is NotificationOpts {
    return typeof ((input as any).content) !== "undefined"
}

export function showNotification(input: wecco.ElementUpdate | NotificationOpts) {
    const opts = isOpts(input) ? input : {
        content: input,
    }
    opts.style = opts.style ?? "info"

    const outlet = document.body.appendChild(document.createElement("div"))

    const init = (evt: Event) => {
        const e = evt.target as HTMLElement

        e.addEventListener("transitionend", () => {
            setTimeout(() => {
                e.addEventListener("transitionend", () => {
                    document.body.removeChild(outlet)
                }, { once: true })
                setTimeout(() => e.style.opacity = "0")
            }, ShowNotificationTime)
        }, { once: true })
        setTimeout(() => e.style.opacity = "1")
    }

    wecco.updateElement(outlet, wecco.html`
<div @update=${init} class="notification ${opts.style}"> 
  <div class="px-4 py-2 -mx-3">
      <div class="mx-3">
          <p class="text-sm">${opts.content}</p>
      </div>
  </div>
</div>    
    `)
}