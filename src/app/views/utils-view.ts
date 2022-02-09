import { Button } from '@youwol/fv-button'

export const innerTabClasses = 'p-2 fv-text-primary h-100 d-flex flex-column '

export function button(icon: string, text: string) {
    return new Button.View({
        contentView: () => ({
            children: [
                { tag: 'i', class: icon },
                { tag: 'span', class: 'px-2', innerText: text },
            ],
        }),
        class: 'fv-btn fv-btn-secondary mx-2',
    })
}

export const classesButton =
    'd-flex border p-2 rounded  fv-bg-secondary fv-hover-xx-lighter fv-pointer mx-2 align-items-center'
