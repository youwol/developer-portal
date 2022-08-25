import { attr$, children$, Stream$, VirtualDOM } from '@youwol/flux-view'
import { Observable } from 'rxjs'
import { Screen, Topic } from '../app-state'

export const classesButton =
    'd-flex border p-2 rounded  fv-bg-secondary fv-hover-xx-lighter fv-pointer mx-2 align-items-center'

export const leftTabWidth = '300px'
export const commonClassesLeftSideNav =
    'p-2 d-flex flex-column h-100 fv-bg-background fv-x-lighter'

/**
 * @category View
 */
export class Section implements VirtualDOM {

    /**
     * @group Immutable DOM Constants
     */
    public readonly class: string = 'my-2'

    /**
     * @group Immutable Constants
     */
    public readonly header: VirtualDOM

    /**
     * @group Immutable Constants
     */
    public readonly content?: VirtualDOM

    /**
     * @group Immutable DOM Constants
     */
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

/**
 * @category View
 */
export class SectionHeader implements VirtualDOM {

    /**
     * @group Immutable Constants
     */
    public readonly title: string | Stream$<unknown, string>

    /**
     * @group Immutable Constants
     */
    public readonly icon: string

    /**
     * @group Immutable DOM Constants
     */
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

/**
 * @category View
 */
export class DashboardTemplateView<TData, TState> implements VirtualDOM {

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 h-100'

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        maxHeight: '100%',
        height: 'fit-content',
    }

    /**
     * @group Observables
     */
    public readonly dataSource$: Observable<TData[]>

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    /**
     * @group Immutable Constants
     */
    public readonly cardView: (data: TData, state: TState) => VirtualDOM

    /**
     * @group States
     */
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

/**
 * @category View
 */
export class ItemView<TState, TData> implements VirtualDOM {

    /**
     * @group Immutable DOM Constants
     */
    public readonly class =
        'rounded p-2 fv-pointer fv-border-primary fv-hover-border-focus text-center m-3'

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        height: 'fit-content',
    }

    /**
     * @group States
     */
    public readonly state: TState

    /**
     * @group Immutable Constants
     */
    public readonly item: TData

    /**
     * @group Immutable Constants
     */
    public readonly cardView: (data: TData, state: TState) => VirtualDOM

    /**
     * @group Immutable DOM Constants
     */
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

/**
 * @category View
 */
export class CopyClipboardView implements VirtualDOM {

    /**
     * @group Immutable DOM Constants
     */
    public readonly class =
        'fas fa-clipboard p-1 rounded fv-pointer fv-bg-background-alt fv-bg-secondary_active fv-hover-xx-lighter mx-2'

    /**
     * @group Immutable Constants
     */
    public readonly text: string

    /**
     * @group Immutable DOM Constants
     */
    public readonly onclick = () =>
        navigator.clipboard.writeText(this.text).then(() => {
            /*NOOP*/
        })

    constructor(params: { text: string }) {
        Object.assign(this, params)
    }
}

/**
 * @category View
 */
export class AttributeTitleView {

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'col col-sm-3'

    /**
     * @group Immutable DOM Constants
     */
    public readonly innerText: string

    /**
     * @group Immutable Constants
     */
    public readonly text: string

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        fontWeight: 'bolder',
        whiteSpace: 'nowrap',
    }
    constructor(params: { text: string }) {
        Object.assign(this, params)
        this.innerText = this.text
    }
}

/**
 * @category View
 */
export class AttributeValueView {

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'd-flex align-items-center flex-grow-1'

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        minWidth: '0px',
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    /**
     * @group Immutable Constants
     */
    public readonly value: string

    constructor(params: { value: string; [k: string]: string }) {
        this.value = params.value

        this.children = [
            {
                innerText: this.value,
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

/**
 * @category View
 */
export class AttributeView implements VirtualDOM{

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'd-flex align-items-center'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor({ text, value }) {
        this.children = [
            new AttributeTitleView({ text }),
            new AttributeValueView({ value }),
        ]
    }
}

/**
 * @category View
 */
export class TableView<TData> implements VirtualDOM {

    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'table'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'fv-color-primary text-center'

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = { maxHeight: '100%', width: 'fit-content' }

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]


    /**
     * @group Immutable Constants
     */
    public readonly columns: { property: (TData) => string; name: string }[]

    /**
     * @group Immutable Constants
     */
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

/**
 * @category View
 */
export class DashboardTitle {

    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'h5'

    /**
     * @group Immutable DOM Constants
     */
    public readonly innerText: string

    /**
     * @group Immutable Constants
     */
    public readonly title: string

    constructor(params: { title: string }) {
        Object.assign(this, params)
        this.innerText = this.title
    }
}
