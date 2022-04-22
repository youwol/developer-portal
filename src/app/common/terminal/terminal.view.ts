import {
    attr$,
    child$,
    childrenAppendOnly$,
    childrenWithReplace$,
    HTMLElement$,
    VirtualDOM,
} from '@youwol/flux-view'
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs'
import { delay, filter, map, take, takeUntil } from 'rxjs/operators'
import { AttributesView, labelMethodIcons, LogView } from './log.view'

type ContextMessage = any

export class NodeHeaderView implements VirtualDOM {
    public readonly class = 'd-flex align-items-center fv-pointer my-2'
    public readonly style = {
        maxWidth: '50%',
    }
    public readonly children: VirtualDOM[]
    public readonly onclick: (ev: MouseEvent) => void

    constructor(
        message: ContextMessage,
        visible$: BehaviorSubject<boolean>,
        expanded$: BehaviorSubject<boolean>,
        status$: Observable<Status>,
    ) {
        this.children = [
            {
                class: attr$(
                    visible$,
                    (visible): string =>
                        visible ? 'fa-caret-down' : 'fa-caret-right',
                    {
                        wrapper: (d) => `fas mr-2 ${d}`,
                    },
                ),
            },
            {
                class: attr$(status$, (status) => {
                    return (
                        {
                            processing: 'fas fa-spinner fa-spin',
                            error: 'fas fa-times fv-text-error',
                            success: 'fas fa-check fv-text-success',
                        }[status] + ' mr-2'
                    )
                }),
            },
            {
                children: [
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
                ],
            },
            new AttributesView(message.attributes),
        ]
        this.onclick = (ev) => {
            ev.stopPropagation()
            if (!expanded$.getValue()) {
                expanded$.next(true)
            }
            visible$.next(!visible$.getValue())
        }
    }
}

type Status = 'processing' | 'error' | 'success'

export class NodeView implements VirtualDOM {
    public readonly children: VirtualDOM[]

    createdChildren = []
    expanded$: BehaviorSubject<boolean>
    visible$: BehaviorSubject<boolean>

    status$ = new BehaviorSubject<Status>('processing')

    headerMessage: ContextMessage = undefined

    constructor(
        public readonly state: TerminalState,
        public readonly contextId: string,
        public readonly nestedIndex: number,
        public readonly expanded: boolean,
        messages$: { [key: string]: ReplaySubject<ContextMessage> },
    ) {
        this.expanded$ = new BehaviorSubject<boolean>(expanded)
        this.visible$ = new BehaviorSubject<boolean>(expanded)

        messages$[contextId]
            .pipe(
                filter((message) => message.contextId == this.contextId),
                takeUntil(this.status$.pipe(filter((s) => s != 'processing'))),
            )
            .subscribe((message) => {
                if (message.labels.includes('Label.FAILED')) {
                    this.status$.next('error')
                }

                if (message.labels.includes('Label.DONE')) {
                    this.status$.next('success')
                }
            })

        this.children = [
            {
                class: 'd-flex flex-column overflow-auto',
                children: [
                    child$(
                        messages$[contextId].pipe(
                            filter(
                                (m) =>
                                    m.contextId == this.contextId &&
                                    m.labels.includes('Label.STARTED'),
                            ),
                            take(1),
                        ),
                        (m) => {
                            this.headerMessage = m
                            return new NodeHeaderView(
                                m,
                                this.visible$,
                                this.expanded$,
                                this.status$,
                            )
                        },
                    ),
                    child$(this.expanded$, (exp) => {
                        if (!exp) {
                            return {}
                        }
                        return {
                            class: attr$(this.visible$, (visible) =>
                                visible ? 'py-2' : 'd-none',
                            ),
                            style: {
                                paddingLeft: `${
                                    this.nestedIndex > 0 ? 40 : 0
                                }px`,
                            },
                            children: childrenAppendOnly$(
                                messages$[contextId].pipe(
                                    filter((m) => {
                                        return !m.labels.includes(
                                            'Label.STARTED',
                                        )
                                    }),
                                    map((message) => [message]),
                                ),
                                (message: ContextMessage) => {
                                    if (message.contextId == contextId) {
                                        return new LogView({
                                            state: this.state,
                                            message,
                                        })
                                    }

                                    if (
                                        message.parentContextId == contextId &&
                                        !this.createdChildren.includes(
                                            message.contextId,
                                        )
                                    ) {
                                        this.createdChildren.push(
                                            message.contextId,
                                        )
                                        return new NodeView(
                                            this.state,
                                            message.contextId,
                                            nestedIndex + 1,
                                            false,
                                            messages$,
                                        )
                                    }
                                    return { class: 'd-none' }
                                },
                            ),
                        }
                    }),
                ],
            },
        ]
    }
}

const invite = `
                    *@@@@@@,         
                    *@@@@@@,                
          /@@@@@@%  *@@@@@@,  %@@@@@@(      
        ,&@@@@@@@@@@@@@@@@@@@@@@@@@@@@&*    
             %@@@@@@@@@@@@@@@@@@@@%         
    (            /@@@@@@@@@@@@/            /
    @@@@#.           ,&@@&*           .#@@@@
    @@@@@@@@@.                    .@@@@@@@@@
    #@@@@@@@@@@@@(            (@@@@@@@@@@@@#
        /@@@@@@@@@@@#      #@@@@@@@@@@@(    
        *@@@@@@@@@@@#      #@@@@@@@@@@@/    
    (@@@@@@@@@@@@@@@#      #@@@@@@@@@@@@@@@#
    @@@@@@@@@*&@@@@@#      #@@@@@&,@@@@@@@@@
     .#@%.    &@@@@@#      #@@@@@&    .#@%. 
              &@@@@@#      #@@@@@&          
              ,@@@@@#      #@@@@@,          
                  .##      ##.
`

export class TerminalState {
    customViews$ = new BehaviorSubject<{ name: string; view: VirtualDOM }[]>([
        { name: 'TERMINAL', view: undefined },
    ])

    selectedView$ = new BehaviorSubject<string | 'TERMINAL'>('TERMINAL')
    public readonly expanded$ = new BehaviorSubject(true)

    openCustomView(name: string, view: VirtualDOM) {
        const actual = this.customViews$.getValue()
        this.customViews$.next([...actual, { name, view }])
    }
}

export class TerminalView implements VirtualDOM {
    public readonly state = new TerminalState()

    public readonly commands$ = new BehaviorSubject([invite, ''])
    contentElement: HTMLDivElement

    public readonly class = attr$(
        this.state.expanded$,
        (expanded): string => (expanded ? 'w-100 h-50' : 'w-100'),
        {
            wrapper: (d) => `${d} w-100 d-flex flex-column flex-grow-1 `,
        },
    )
    children: VirtualDOM[]

    connectedCallback: (elem: HTMLElement$ & HTMLDivElement) => void

    messages$: { [key: string]: ReplaySubject<ContextMessage> } = {
        root: new ReplaySubject(),
    }

    constructor(messages$: Observable<ContextMessage>) {
        messages$.subscribe((message) => {
            if (!this.messages$[message.parentContextId]) {
                message.parentContextId = 'root'
            }
            if (!message.parentContextId) {
                return
            }
            if (this.messages$[message.contextId]) {
                this.messages$[message.contextId].next(message)
                this.messages$[message.parentContextId].next(message)
                return
            }
            this.messages$[message.contextId] = new ReplaySubject()
            this.messages$[message.contextId].next(message)
            this.messages$[message.parentContextId].next(message)
        })

        this.children = [
            //new TerminalHeaderView({ state: this.state }),
            child$(this.state.expanded$, (expanded) =>
                expanded ? this.contentView() : {},
            ),
        ]

        this.commands$.pipe(delay(0)).subscribe(() => {
            if (!this.contentElement) {
                return
            }
            this.contentElement.scrollTop = this.contentElement.scrollHeight
        })
    }

    logsView() {
        return {
            class: `d-flex flex-column h-100 w-100 overflow-auto p-2`,
            children: [
                {
                    children: childrenAppendOnly$(this.commands$, (command) => {
                        if (command == invite) {
                            return {
                                class: 'd-flex justify-content-around',
                                children: [
                                    {
                                        tag: 'pre',
                                        class: 'fv-text-success mx-auto',
                                        innerHTML: command,
                                        style: { fontSize: '8px' },
                                    },
                                ],
                            }
                        }
                        return {
                            tag: 'pre',
                            class: 'fv-text-success mx-auto w-100',
                            innerHTML: command,
                        }
                    }),
                },
                new NodeView(this.state, 'root', 0, true, this.messages$),
            ],
            connectedCallback: (elem) => {
                this.contentElement = elem
                this.contentElement.scrollTop = this.contentElement.scrollHeight
                this.messages$['root'].subscribe(() => {
                    this.contentElement.scrollTop =
                        this.contentElement.scrollHeight
                })
            },
        }
    }

    contentView() {
        return {
            class: 'flex-grow-1',
            style: {
                minHeight: '0px',
            },
            children: childrenWithReplace$(
                this.state.customViews$,
                ({ name, view }) => {
                    return {
                        class: attr$(
                            this.state.selectedView$,
                            (selectedView: string | 'TERMINAL'): string =>
                                selectedView == name ? 'd-block' : 'd-none',
                            {
                                wrapper: (d) => `${d} w-100 h-100`,
                            },
                        ),
                        children: [name == 'TERMINAL' ? this.logsView() : view],
                    }
                },
                {},
            ),
        }
    }
}
