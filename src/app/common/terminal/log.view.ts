import { VirtualDOM } from '@youwol/flux-view'
import { PyYouwol as pyYw } from '@youwol/http-clients'
import { DataView } from './data.view'
import { ChartExplorerView } from './factories/helm.view'
import { TerminalState } from './terminal.view'

type KnownViews = 'HelmPackage'

export const labelMethodIcons = {
    'Label.ADMIN': 'fas fa-users-cog',
    'Label.API_GATEWAY': 'fas fa-door-open',
    'Label.MIDDLEWARE': 'fas fa-ghost',
    'Label.END_POINT': 'fas fa-microchip',
    'Label.APPLICATION': 'fas fa-play',
    'Label.LOG': 'fas fa-edit',
}
export const labelLogIcons = {
    'Label.LOG_WARNING': 'fas fa-exclamation-circle fv-text-focus',
    'Label.LOG_ERROR': 'fas fa-times fv-text-error',
    'Label.DONE': 'fas fa-flag',
}

const viewsFactory: Record<KnownViews, (d) => VirtualDOM> = {
    HelmPackage: (data) => new ChartExplorerView(data),
}

export class LogView implements VirtualDOM {
    public readonly class = 'd-flex align-items-center fv-pointer'
    public readonly style = {}
    public readonly children: VirtualDOM[]

    public readonly state: TerminalState
    public readonly message: pyYw.ContextMessage

    constructor(params: {
        state: TerminalState
        message: pyYw.ContextMessage
    }) {
        Object.assign(this, params)

        let customView: VirtualDOM
        if (this.message.level == 'DATA') {
            const views = Object.keys(viewsFactory)
                .filter((key) =>
                    this.message.labels.includes(key as pyYw.Label),
                )
                .map((key: KnownViews) => ({
                    name: key,
                    factory: viewsFactory[key],
                }))

            if (views.length > 0) {
                customView = {
                    innerText: views[0].name,
                    class: 'fv-bg-secondary border rounded fv-hover-xx-lighter p-1',
                    onclick: () => {
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
                class: 'd-flex flex-align-center px-2',
                children: this.message.labels
                    .filter((label) => labelLogIcons[label])
                    .map((label) => {
                        return {
                            class: labelLogIcons[label] + ' mx-1',
                        }
                    }),
            },
            {
                innerText: this.message.text,
            },
            customView,
            this.message.data ? new DataView(this.message.data) : undefined,
        ]
    }
}

export class MethodLabelView {
    public readonly class = 'd-flex align-items-center mr-3'
    public readonly children: VirtualDOM[]

    constructor(message: pyYw.ContextMessage) {
        this.children = [
            {
                class: 'd-flex flex-align-center px-2',
                children: message.labels
                    .filter((label) => labelMethodIcons[label])
                    .map((label) => {
                        return {
                            class: labelMethodIcons[label] + ' mx-1',
                        }
                    }),
            },
            {
                class: 'mr-3',
                innerText: message.text,
            },
        ]
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

    constructor(attributes: { [key: string]: unknown }) {
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
