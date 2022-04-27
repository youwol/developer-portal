import { attr$, children$, Stream$, VirtualDOM } from '@youwol/flux-view'
import { Observable } from 'rxjs'
import { Screen, Topic } from '../app-state'

export const classesButton =
    'd-flex border p-2 rounded  fv-bg-secondary fv-hover-xx-lighter fv-pointer mx-2 align-items-center'

export class Section implements VirtualDOM {
    public readonly class: string = 'my-2'
    public readonly header: VirtualDOM
    public readonly content?: VirtualDOM
    public readonly children: VirtualDOM[]
    constructor(params: {
        header: VirtualDOM
        content?: VirtualDOM
        [k: string]: unknown
    }) {
        Object.assign(this, params)
        this.children = [this.header, this.content ? this.content : undefined]
    }
}

export class SectionHeader implements VirtualDOM {
    public readonly title: string | Stream$<unknown, string>
    public readonly icon: string
    public readonly children: VirtualDOM[]

    constructor(params: {
        title: string | Stream$<unknown, string>
        icon: string
        [k: string]: unknown
    }) {
        Object.assign(this, params)
        this.children = [
            {
                class: 'd-flex align-items-center fv-pointer',
                children: [
                    {
                        class: `fas ${this.icon} mr-2`,
                    },
                    {
                        innerText: this.title,
                    },
                ],
            },
        ]
    }
}

export class DashboardTemplateView<TData, TState> implements VirtualDOM {
    public readonly class = 'w-100 h-100'

    public readonly style = {
        maxHeight: '100%',
        height: 'fit-content',
    }
    public readonly dataSource$: Observable<TData[]>
    public readonly children: VirtualDOM[]
    public readonly cardView: (data: TData, state: TState) => VirtualDOM
    public readonly state: TState

    constructor(params: {
        state: TState
        dataSource$: Observable<TData[]>
        cardView: (data: TData, state: TState) => VirtualDOM
    }) {
        Object.assign(this, params)
        this.children = [
            {
                class: 'w-100 h-100 d-flex flex-wrap p-2 overflow-auto  justify-content-around',
                children: children$(this.dataSource$, (items: TData[]) => {
                    return items.map(
                        (item) =>
                            new ItemView({
                                state: this.state,
                                item,
                                cardView: this.cardView,
                            }),
                    )
                }),
            },
        ]
    }
}

export function leftNavSectionAttr$({
    selectedScreen$,
    targetTopic,
    targetViewId,
}: {
    selectedScreen$: Observable<Screen>
    targetTopic: Topic
    targetViewId: string
}) {
    return attr$(
        selectedScreen$,
        (screen): string => {
            return screen.viewId == targetViewId && screen.topic == targetTopic
                ? 'fv-text-focus'
                : ''
        },
        {
            wrapper: (d) =>
                `${d} fv-hover-bg-background-alt d-flex align-items-center px-1 rounded`,
        },
    )
}

export class ItemView<TState, TData> implements VirtualDOM {
    public readonly class =
        'rounded p-2 fv-pointer fv-border-primary fv-hover-border-focus text-center m-3'
    public readonly state: TState
    public readonly item: TData
    public readonly cardView: (data: TData, state: TState) => VirtualDOM
    public readonly children: VirtualDOM[]
    constructor(params: {
        state: TState
        item: TData
        cardView: (data: TData, state: TState) => VirtualDOM
    }) {
        Object.assign(this, params)
        this.children = [this.cardView(this.item, this.state)]
    }
}

export class CopyClipboardView implements VirtualDOM {
    public readonly class =
        'fas fa-clipboard p-1 rounded fv-pointer fv-bg-background-alt fv-bg-secondary_active fv-hover-xx-lighter mx-2'
    public readonly text: string
    public readonly onclick = () =>
        navigator.clipboard.writeText(this.text).then(() => {
            /*NOOP*/
        })

    constructor(params: { text: string }) {
        Object.assign(this, params)
    }
}

export class AttributeTitleView {
    public readonly class = 'col col-sm-3'
    public readonly innerText: string
    public readonly text: string
    public readonly style = {
        fontWeight: 'bolder',
    }
    constructor(params: { text: string }) {
        Object.assign(this, params)
        this.innerText = this.text
    }
}

export class AttributeValueView {
    public readonly class = 'd-flex align-items-center flex-grow-1'
    public readonly children: VirtualDOM[]
    public readonly value: string

    constructor(params: { value: string; [k: string]: string }) {
        this.value = params.value
        const displayed =
            typeof this.value != 'string' || this.value.length < 50
                ? this.value
                : this.value.slice(0, 25) + '...' + this.value.slice(-25)
        this.children = [
            {
                innerText: displayed,
                style: {
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                },
                ...params,
            },
            new CopyClipboardView({ text: this.value }),
        ]
    }
}

export class AttributeView {
    public readonly class = 'd-flex align-items-center'
    public readonly children: VirtualDOM[]
    constructor({ text, value }) {
        this.children = [
            new AttributeTitleView({ text }),
            new AttributeValueView({ value }),
        ]
    }
}

export class TableView<TData> implements VirtualDOM {
    public readonly tag = 'table'
    public readonly class = 'fv-color-primary text-center'
    public readonly style = { maxHeight: '100%', width: 'fit-content' }
    public readonly children: VirtualDOM[]

    public readonly columns: { property: (TData) => string; name: string }[]
    public readonly items: TData[]

    constructor(params: {
        columns: { property: (TData) => string; name: string }[]
        items: TData[]
    }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'thead',
                children: [
                    {
                        tag: 'tr',
                        class: 'fv-bg-background-alt',
                        children: this.columns.map((column) => {
                            return {
                                tag: 'td',
                                innerText: column.name,
                                class: 'px-4',
                            }
                        }),
                    },
                ],
            },
            {
                tag: 'tbody',
                children: this.items.map((item) => {
                    return {
                        tag: 'tr',
                        children: this.columns.map((column) => {
                            return {
                                tag: 'td',
                                innerText: column.property(item),
                                class: 'px-4',
                            }
                        }),
                    }
                }),
            },
        ]
    }
}

export class DashboardTitle {
    public readonly tag = 'h5'
    public readonly innerText: string
    public readonly title: string

    constructor(params: { title: string }) {
        Object.assign(this, params)
        this.innerText = this.title
    }
}

export class DashboardSubTitle {
    public readonly tag = 'h6'
    public readonly innerText: string
    public readonly title: string

    constructor(params: { title: string }) {
        Object.assign(this, params)
        this.innerText = this.title
    }
}
