import { EnvironmentState, Method } from '../environment.state'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import * as pyYw from '@youwol/local-youwol-client'
import { AttributeView, DashboardTitle } from '../../common'
import { BehaviorSubject, from, Observable, of, Subject } from 'rxjs'
import { ObjectJs } from '@youwol/rx-tree-views'
import { install } from '@youwol/webpm-client'
import { catchError, mergeMap, withLatestFrom } from 'rxjs/operators'
import { DockableTabs } from '@youwol/rx-tab-views'
import { TerminalView } from '../../common/terminal'

function fetchCodeMirror$(): Observable<WindowOrWorkerGlobalScope> {
    return from(
        install({
            modules: ['codemirror'],
            scripts: ['codemirror#5.52.0~mode/javascript.min.js'],
            css: [
                'codemirror#5.52.0~codemirror.min.css',
                'codemirror#5.52.0~theme/blackboard.min.css',
            ],
        }),
    )
}

/**
 * @category View
 */
export class CommandView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'p-2 d-flex h-100 flex-column'
    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        position: 'relative' as const,
    }
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    /**
     * @group States
     */
    public readonly environmentState: EnvironmentState

    /**
     * @group Immutable Constants
     */
    public readonly command: pyYw.Routers.Environment.Command

    constructor(params: {
        environmentState: EnvironmentState
        command: pyYw.Routers.Environment.Command
    }) {
        Object.assign(this, params)
        let method: Method = 'GET'
        if (this.command['do_post'] != null) {
            method = 'POST'
        }
        if (this.command['do_delete'] != null) {
            method = 'DELETE'
        }
        if (this.command['do_put'] != null) {
            method = 'PUT'
        }
        const url = `/admin/custom-commands/${this.command.name}`

        const bottomNavState = new DockableTabs.State({
            disposition: 'bottom',
            persistTabsView: true,
            viewState$: new BehaviorSubject<DockableTabs.DisplayMode>(
                'collapsed',
            ),
            tabs$: new BehaviorSubject([
                new LogsTab({
                    environmentState: this.environmentState,
                    command: this.command,
                }),
            ]),
            selected$: new BehaviorSubject<string>('logs'),
        })
        const bottomNav = new DockableTabs.View({
            state: bottomNavState,
            styleOptions: { initialPanelSize: '500px' },
        })

        this.children = [
            new AttributeView({ text: 'Method', value: method }),
            new AttributeView({
                text: 'URL',
                value: url,
            }),
            method == 'GET' || method == 'DELETE'
                ? new ExecuteNoBodyView({
                      environmentState: this.environmentState,
                      command: this.command,
                      method,
                      url,
                  })
                : new ExecuteBodyView({
                      environmentState: this.environmentState,
                      command: this.command,
                      method,
                      url,
                  }),
            { tag: 'div', class: 'flex-grow-1', style: { minHeight: '0px' } },
            bottomNav,
        ]
    }
}

/**
 * @category View
 */
export class ExecuteView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'my-3 d-flex flex-column overflow-auto'

    /**
     * @group States
     */
    public readonly environmentState: EnvironmentState

    /**
     * @group Immutable Constants
     */
    public readonly method: Method

    /**
     * @group Immutable Constants
     */
    public readonly url: string

    /**
     * @group Observables
     */
    public readonly output$ = new Subject()

    constructor(params: {
        environmentState: EnvironmentState
        command: pyYw.Routers.Environment.Command
        method: Method
        url: string
    }) {
        Object.assign(this, params)
    }
}

/**
 * @category View
 */
export class ExecuteNoBodyView extends ExecuteView {
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(params) {
        super(params)
        Object.assign(this, params)

        this.children = [
            new DashboardTitle({ title: 'Execute command' }),
            new PlayButtonView({
                onclick: () =>
                    this.environmentState
                        .executeNoBodyCommand$({
                            url: this.url,
                            method: this.method,
                        })
                        .pipe(
                            catchError((err) => of(new ErrorCommandExec(err))),
                        )
                        .subscribe((out) => this.output$.next(out)),
            }),
            {
                source$: this.output$,
                vdomMap: (output) => new OutputView({ output }),
            },
        ]
    }
}

export class ErrorCommandExec {
    constructor(public readonly details: unknown) {}
}

/**
 * @category View
 */
export class ExecuteBodyView extends ExecuteView {
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(params) {
        super(params)

        const bodyView = new BodyView({})
        const playView = new PlayButtonView({})
        playView.click$
            .pipe(
                withLatestFrom(bodyView.body$),
                mergeMap(([, body]) => {
                    try {
                        const jsonBody = JSON.parse(body)
                        return this.environmentState
                            .executeWithBodyCommand$({
                                url: this.url,
                                body: jsonBody,
                                method: this.method,
                            })
                            .pipe(
                                catchError((err) =>
                                    of(new ErrorCommandExec(err)),
                                ),
                            )
                    } catch (e) {
                        return of(
                            new ErrorCommandExec({
                                error: 'Parsing body in JSON failed',
                                original: String(e),
                            }),
                        )
                    }
                }),
            )
            .subscribe((out) => {
                this.output$.next(out)
            })

        this.children = [
            new DashboardTitle({ title: 'Execute command' }),
            bodyView,
            playView,
            {
                source$: this.output$,
                vdomMap: (output) => new OutputView({ output }),
            },
        ]
    }
}

/**
 * @category View
 */
export class PlayButtonView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class =
        'fv-pointer p-1 fv-bg-secondary fv-hover-xx-lighter rounded border d-flex align-items-center'
    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        width: 'fit-content',
    }
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    /**
     * @group Observables
     */
    public readonly click$ = new Subject()

    /**
     * @group Immutable DOM Constants
     */
    public readonly onclick = (ev) => {
        this.click$.next(ev)
    }

    constructor(params) {
        Object.assign(this, params)
        this.children = [{ tag: 'div', class: 'fas fa-play px-2' }]
    }
}

/**
 * @category View
 */
export class BodyView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'my-1 d-flex flex-column'
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    /**
     * @group Configurations
     */
    public readonly codeMirrorConfiguration = {
        lineNumbers: true,
        theme: 'blackboard',
        lineWrapping: false,
        indentUnit: 4,
        mode: 'javascript',
    }
    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        fontSize: 'small',
        minHeight: '250px',
    }
    /**
     * @group Observables
     */
    public readonly body$ = new BehaviorSubject<string>('{}')

    constructor(params) {
        Object.assign(this, params)

        this.children = [
            {
                tag: 'div',
                innerText: "Command's body (json format):",
            },
            {
                source$: fetchCodeMirror$(),
                vdomMap: () => {
                    return {
                        tag: 'div',
                        class: 'flex-grow-1',
                        connectedCallback: (htmlElement: HTMLDivElement) => {
                            const config = {
                                ...this.codeMirrorConfiguration,
                                value: '{}',
                            }
                            const editor = window['CodeMirror'](
                                htmlElement,
                                config,
                            )
                            editor.on('changes', (_, changeObj) => {
                                if (
                                    changeObj.length == 1 &&
                                    changeObj[0].origin == 'setValue'
                                ) {
                                    return
                                }
                                this.body$.next(editor.getValue())
                            })
                        },
                    }
                },
            },
        ]
    }
}

/**
 * @category View
 */
export class OutputView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'my-3'
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    /**
     * @group Immutable Constants
     */
    public readonly output: unknown

    constructor(params: { output: unknown }) {
        Object.assign(this, params)
        this.children = [
            this.output instanceof ErrorCommandExec
                ? new DashboardTitle({ title: 'Error' })
                : new DashboardTitle({ title: 'Output' }),
            new ObjectJs.View({
                state: new ObjectJs.State({
                    title: 'response',
                    data: this.output,
                }),
            }),
        ]
    }
}

/**
 * @category View
 */
export class LogsTab extends DockableTabs.Tab {
    constructor(params: {
        environmentState: EnvironmentState
        command: pyYw.Routers.Environment.Command
    }) {
        super({
            id: 'logs',
            title: 'Logs',
            icon: 'fas fa-volume-up',
            content: () => {
                return new LogsTabView({
                    environmentState: params.environmentState,
                    command: params.command,
                })
            },
        })
    }
}

/**
 * @category View
 */
export class LogsTabView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group States
     */
    public readonly environmentState: EnvironmentState
    /**
     * @group Immutable Constants
     */
    public readonly command: pyYw.Routers.Environment.Command
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'p-2 d-flex flex-column h-100 overflow-auto'
    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        minHeight: '500px',
        maxHeight: '500px',
    }
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(params: {
        environmentState: EnvironmentState
        command: pyYw.Routers.Environment.Command
    }) {
        Object.assign(this, params)
        const events = this.environmentState.commandsEvent[this.command.name]
        this.children = [new TerminalView(events.log$)]
    }
}
