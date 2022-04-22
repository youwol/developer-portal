import { children$, Stream$, VirtualDOM } from '@youwol/flux-view'
import { Observable } from 'rxjs'

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
        dataSource$: Observable<TData>
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
