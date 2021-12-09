import { attr$, child$, VirtualDOM } from "@youwol/flux-view"
import { Button } from "@youwol/fv-button"
import { BehaviorSubject } from "rxjs"


export let innerTabClasses = 'p-2 fv-text-primary h-100 d-flex flex-column '

export function button(icon: string, text: string) {

    let button = new Button.View({
        contentView: () => ({
            children: [
                { tag: 'i', class: icon },
                { tag: 'span', class: 'px-2', innerText: text },
            ]
        }),
        class: 'fv-btn fv-btn-secondary mx-2'
    } as any)

    return button
}
