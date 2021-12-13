
import { VirtualDOM } from "@youwol/flux-view"
import { ContextMessage } from "../../client/models"
import { DataView } from './data.view'


export class LogView implements VirtualDOM {

    public readonly class = 'd-flex align-items-center fv-pointer'

    public readonly children: VirtualDOM[]

    public readonly classesFactory = {
        "ERROR": "fv-text-error "
    }

    constructor(message: ContextMessage) {


        this.children = [
            {
                class: this.classesFactory[message.level] || ""
            },
            {
                class: this.classesFactory[message.level] || "",
                innerText: message.level == "ERROR" ? message.text : message.text
            },
            new LabelsView(message.labels),
            message.data ? new DataView(message.data as any) : undefined
        ]
    }
}


export class LabelsView {

    public readonly class = "d-flex align-items-center mr-3"
    public readonly children: VirtualDOM[]

    constructor(labels: string[]) {

        let factory = {
            "Label.INFO": 'fas fa-info',
            "Label.DONE": 'fas fa-flag-checkered'
        }
        this.children = labels
            .filter((label) => factory[label] != undefined)
            .map(label => ({ class: factory[label] }))

    }
}

export class AttributesView {

    public readonly tag = 'table'
    public readonly class = ""
    public readonly children: VirtualDOM[]
    public readonly style = {
        'fontSize': "small"
    }
    constructor(attributes: { [key: string]: any }) {


        this.children = [
            {
                tag: 'tr',
                children: Object.keys(attributes).map((attName) => {
                    return {
                        tag: 'th',
                        class: 'px-2',
                        innerText: attName
                    }
                })
            },
            {
                tag: 'tr',
                children: Object.values(attributes).map((value) => {
                    return {
                        tag: 'td',
                        class: 'px-2',
                        innerText: value
                    }
                })
            }
        ]
    }
}
