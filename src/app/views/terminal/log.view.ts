import { VirtualDOM } from '@youwol/flux-view'
import { ContextMessage } from '../../client/models'
import { DataView } from './data.view'
import { ChartExplorerView } from './factories/helm.view'
import { TerminalState } from './terminal.view'

type KnownViews = 'HelmPackage'

const viewsFactory: Record<KnownViews, (d) => VirtualDOM> = {
    HelmPackage: (data) => new ChartExplorerView(data),
}

export class LogView implements VirtualDOM {
    public readonly class = 'd-flex align-items-center fv-pointer'
    public readonly style = {}
    public readonly children: VirtualDOM[]

    public readonly classesFactory = {
        ERROR: 'fv-text-error ',
    }
    public readonly state: TerminalState
    public readonly message: ContextMessage

    constructor(params: { state: TerminalState; message: ContextMessage }) {
        Object.assign(this, params)
        let customView: VirtualDOM
        if (this.message.level == 'DATA') {
            const views = Object.keys(viewsFactory)
                .filter((key) => this.message.labels.includes(key as any))
                .map((key: KnownViews) => ({
                    name: key,
                    factory: viewsFactory[key],
                }))

            if (views.length > 0) {
                customView = {
                    innerText: views[0].name,
                    class: 'fv-bg-secondary border rounded fv-hover-xx-lighter p-1',
                    onclick: (ev) => {
                        const view = views[0].factory(this.message.data)
                        this.state.openCustomView(views[0].name, view)
                    },
                }
            }
        }
        this.style = this.message.labels.includes('Label.BASH')
            ? { fontFamily: 'monospace', fontSize: 'x-small' }
            : {}

        this.children = [
            {
                class: this.classesFactory[this.message.level] || '',
            },
            {
                class: this.classesFactory[this.message.level] || '',
                innerText: this.message.text,
            },
            customView,
            new LabelsView(this.message.labels),
            this.message.data
                ? new DataView(this.message.data as any)
                : undefined,
        ]
    }
}

export class LabelsView {
    public readonly class = 'd-flex align-items-center mr-3'
    public readonly children: VirtualDOM[]

    constructor(labels: string[]) {
        const factory = {
            'Label.INFO': 'fas fa-info',
            'Label.DONE': 'fas fa-flag-checkered',
        }
        this.children = labels
            .filter((label) => factory[label] != undefined)
            .map((label) => ({ class: factory[label] }))
    }
}

export class AttributesView {
    public readonly tag = 'table'
    public readonly class = ''
    public readonly children: VirtualDOM[]
    public readonly style = {
        fontSize: 'small',
        maxWidth: '50%',
    }

    constructor(attributes: { [key: string]: any }) {
        this.children = [
            {
                tag: 'tr',
                children: Object.keys(attributes).map((attName) => {
                    return {
                        tag: 'th',
                        class: 'px-2',
                        innerText: attName,
                    }
                }),
            },
            {
                tag: 'tr',
                children: Object.values(attributes).map((value) => {
                    return {
                        tag: 'td',
                        class: 'px-2',
                        innerText: value,
                    }
                }),
            },
        ]
    }
}
