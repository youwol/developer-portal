import { child$, HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { EnvironmentState } from '../environment.state'
import { filter, mergeMap, shareReplay } from 'rxjs/operators'
import { combineLatest, from, Observable } from 'rxjs'
import { install } from '@youwol/cdn-client'

function fetchCodeMirror$(): Observable<Window> {
    return from(
        install({
            modules: ['codemirror'],
            scripts: ['codemirror#5.52.0~mode/python.min.js'],
            css: [
                'codemirror#5.52.0~codemirror.min.css',
                'codemirror#5.52.0~theme/blackboard.min.css',
            ],
        }),
    ).pipe(shareReplay(1))
}

/**
 * @category View
 */
export class ConfigFileView implements VirtualDOM {
    /**
     * @group Configurations
     */
    public readonly codeMirrorConfiguration = {
        lineNumbers: true,
        theme: 'blackboard',
        lineWrapping: false,
        indentUnit: 4,
        readOnly: true,
    }
    /**
     * @group States
     */
    public readonly environmentState: EnvironmentState

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 h-100 p-2 overflow-auto'

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        fontSize: 'smaller',
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(params: { environmentState: EnvironmentState }) {
        Object.assign(this, params)
        const client = this.environmentState.client

        const configFile$ = this.environmentState.environment$.pipe(
            mergeMap(() => client.getFileContent$()),
            raiseHTTPErrors(),
        )
        this.children = [
            child$(
                combineLatest([configFile$, fetchCodeMirror$()]),
                ([content]) => {
                    return {
                        class: 'h-100 w-100',
                        connectedCallback: (
                            htmlElement: HTMLDivElement & HTMLElement$,
                        ) => {
                            const config = {
                                ...this.codeMirrorConfiguration,
                                value: content,
                            }
                            const editor = window['CodeMirror'](
                                htmlElement,
                                config,
                            )
                            const sub =
                                this.environmentState.appState.selectedScreen$
                                    .pipe(
                                        filter(({ topic, viewId }) => {
                                            return (
                                                topic == 'Environment' &&
                                                viewId == 'config-file'
                                            )
                                        }),
                                    )
                                    .subscribe(() => {
                                        editor.refresh()
                                    })
                            htmlElement.ownSubscriptions(sub)
                        },
                    }
                },
            ),
        ]
    }
}
