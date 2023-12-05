import {
    AnyVirtualDOM,
    AttributeLike,
    ChildrenLike,
    VirtualDOM,
} from '@youwol/rx-vdom'
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
export class Section implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class: string = 'my-2'

    /**
     * @group Immutable Constants
     */
    public readonly header: VirtualDOM<'header'>

    /**
     * @group Immutable Constants
     */
    public readonly content?: AnyVirtualDOM

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(params: {
        header: VirtualDOM<'header'>
        content?: AnyVirtualDOM
        [k: string]: unknown
    }) {
        Object.assign(this, params)
        this.children = [this.header, this.content ? this.content : undefined]
    }
}

/**
 * @category View
 */
export class SectionHeader implements VirtualDOM<'header'> {
    /**
     * @group Immutable Constants
     */
    public readonly tag = 'header'

    /**
     * @group Immutable Constants
     */
    public readonly title: AttributeLike<string>

    /**
     * @group Immutable Constants
     */
    public readonly icon: string

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(params: {
        title: AttributeLike<string>
        icon: string
        [k: string]: unknown
    }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'div',
                class: 'd-flex align-items-center fv-pointer',
                children: [
                    {
                        tag: 'div',
                        class: `${this.icon} mr-2`,
                    },
                    {
                        tag: 'div',
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
export class DashboardTemplateView<TData, TState> implements VirtualDOM<'div'> {
    /**
     * @group Immutable Constants
     */
    public readonly tag = 'div'

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
    public readonly children: ChildrenLike

    /**
     * @group Immutable Constants
     */
    public readonly cardView: (data: TData, state: TState) => AnyVirtualDOM

    /**
     * @group States
     */
    public readonly state: TState

    constructor(params: {
        state: TState
        dataSource$: Observable<TData[]>
        cardView: (data: TData, state: TState) => AnyVirtualDOM
    }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'div',
                class: 'w-100 h-100 d-flex flex-wrap p-2 overflow-auto  justify-content-around',
                children: {
                    policy: 'replace',
                    source$: this.dataSource$,
                    vdomMap: (items: TData[]) => {
                        return items.map(
                            (item) =>
                                new ItemView({
                                    state: this.state,
                                    item,
                                    cardView: this.cardView,
                                }),
                        )
                    },
                },
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
    return {
        source$: selectedScreen$,
        vdomMap: (screen: { viewId: string; topic: string }): string => {
            return screen.viewId == targetViewId && screen.topic == targetTopic
                ? 'fv-text-focus'
                : ''
        },
        wrapper: (d) =>
            `${d} fv-hover-bg-background-alt d-flex align-items-center px-1 rounded`,
    }
}

/**
 * @category View
 */
export class ItemView<TState, TData> implements VirtualDOM<'div'> {
    /**
     * @group Immutable Constants
     */
    public readonly tag = 'div'

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
    public readonly cardView: (data: TData, state: TState) => AnyVirtualDOM

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(params: {
        state: TState
        item: TData
        cardView: (data: TData, state: TState) => AnyVirtualDOM
    }) {
        Object.assign(this, params)
        this.children = [this.cardView(this.item, this.state)]
    }
}

/**
 * @category View
 */
export class CopyClipboardView implements VirtualDOM<'div'> {
    /**
     * @group Immutable Constants
     */
    public readonly tag = 'div'

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
export class AttributeTitleView implements VirtualDOM<'div'> {
    /**
     * @group Immutable Constants
     */
    public readonly tag = 'div'

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
        fontWeight: 'bolder' as const,
        whiteSpace: 'nowrap' as const,
    }

    constructor(params: { text: string }) {
        Object.assign(this, params)
        this.innerText = this.text
    }
}

/**
 * @category View
 */
export class AttributeValueView implements VirtualDOM<'div'> {
    /**
     * @group Immutable Constants
     */
    public readonly tag = 'div'

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
    public readonly children: ChildrenLike

    /**
     * @group Immutable Constants
     */
    public readonly value: string

    constructor(params: { value: string; [k: string]: string }) {
        this.value = params.value

        this.children = [
            {
                tag: 'div',
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
export class AttributeView implements VirtualDOM<'div'> {
    /**
     * @group Immutable Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'd-flex align-items-center'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

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
export class DashboardTitle implements VirtualDOM<'h5'> {
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
