import { attr$, child$, VirtualDOM } from '@youwol/flux-view'
import { ProjectsState } from '../projects.state'
import {
    filterCtxMessage,
    HTTPError,
    dispatchHTTPErrors,
} from '@youwol/http-primitives'
import * as pyYw from '@youwol/local-youwol-client'
import { BehaviorSubject, from, Observable, Subject } from 'rxjs'
import { install } from '@youwol/cdn-client'
import { delay, map, shareReplay, tap } from 'rxjs/operators'
import { classesButton, LogsTab } from '../../common'
import { DockableTabs } from '@youwol/fv-tabs'

declare type CodeEditorModule = typeof import('@youwol/fv-code-mirror-editors')

/**
 * Lazy loading of the module `@youwol/fv-code-mirror-editors`
 *
 * @category HTTP
 */
export const loadFvCodeEditorsModule$: () => Observable<CodeEditorModule> =
    () =>
        from(
            install({
                modules: ['@youwol/fv-code-mirror-editors#^0.2.0'],
                scripts: ['codemirror#5.52.0~mode/javascript.min.js'],
                css: [
                    'codemirror#5.52.0~codemirror.min.css',
                    'codemirror#5.52.0~theme/blackboard.min.css',
                ],
                aliases: {
                    codeMirrorEditors: '@youwol/fv-code-mirror-editors',
                },
            }),
        ).pipe(
            map((window) => window['codeMirrorEditors'] as CodeEditorModule),
            shareReplay({ bufferSize: 1, refCount: true }),
        )

/**
 * @category View
 */
export class NewProjectFromTemplateView implements VirtualDOM {
    static loadFvCodeEditors$ = loadFvCodeEditorsModule$()

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'd-flex flex-column w-100 h-100'

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        position: 'relative',
    }

    /**
     * @group Immutable Constants
     */
    public readonly id: string

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    /**
     * @group States
     */
    public readonly projectsState: ProjectsState

    /**
     * @group Immutable Constants
     */
    public readonly projectTemplate: pyYw.Routers.Environment.ProjectTemplate

    constructor(params: {
        projectsState: ProjectsState
        projectTemplate: pyYw.Routers.Environment.ProjectTemplate
    }) {
        Object.assign(this, params)
        const viewState$ = new BehaviorSubject<DockableTabs.DisplayMode>(
            'collapsed',
        )

        const bottomNavState = new DockableTabs.State({
            disposition: 'bottom',
            persistTabsView: true,
            viewState$,
            tabs$: new BehaviorSubject([
                new LogsTab({
                    message$: pyYw.PyYouwolClient.ws.log$.pipe(
                        filterCtxMessage({
                            withLabels: ['Label.PROJECT_CREATING'],
                            withAttributes: {
                                templateType: this.projectTemplate.type,
                            },
                        }),
                        shareReplay(1),
                    ),
                }),
            ]),
            selected$: new BehaviorSubject<string>('logs'),
        })

        const bottomNav = new DockableTabs.View({
            state: bottomNavState,
            styleOptions: { initialPanelSize: '500px' },
        })

        this.children = [
            {
                class: 'w-100 h-100 py-2 overflow-auto',
                style: { minHeight: '0px' },
                children: [
                    new ProjectTemplateHeaderView(params),
                    child$(
                        NewProjectFromTemplateView.loadFvCodeEditors$,
                        (CodeEditorModule: CodeEditorModule) => {
                            return new ProjectTemplateEditor({
                                projectsState: this.projectsState,
                                CodeEditorModule: CodeEditorModule,
                                projectTemplate: this.projectTemplate,
                                onError: () => viewState$.next('expanded'),
                            })
                        },
                    ),
                ],
            },
            bottomNav,
        ]
    }
}

/**
 * @category View
 */
export class ProjectTemplateHeaderView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 text-center d-flex justify-content-center'

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        fontSize: 'x-large',
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    /**
     * @group Immutable Constants
     */
    public readonly projectTemplate: pyYw.Routers.Environment.ProjectTemplate

    constructor(params: {
        projectsState: ProjectsState
        projectTemplate: pyYw.Routers.Environment.ProjectTemplate
    }) {
        Object.assign(this, params)
        this.children = [
            {
                class: 'd-flex align-items-center p-1',
                children: [
                    this.projectTemplate.icon,
                    { class: 'px-2' },
                    {
                        innerText: this.projectTemplate.type,
                    },
                ],
            },
        ]
    }
}

/**
 * @category View
 */
export class ProjectTemplateEditor implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-50 h-50 mx-auto'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    /**
     * @group Immutable Constants
     */
    public readonly projectTemplate: pyYw.Routers.Environment.ProjectTemplate

    /**
     * @group State
     */
    public readonly projectsState: ProjectsState

    /**
     * @group Module
     */
    public readonly CodeEditorModule: CodeEditorModule

    constructor(params: {
        projectsState: ProjectsState
        CodeEditorModule: CodeEditorModule
        projectTemplate: pyYw.Routers.Environment.ProjectTemplate
        onError: () => void
    }) {
        Object.assign(this, params)
        const content = JSON.stringify(this.projectTemplate.parameters, null, 4)

        const ideState = new this.CodeEditorModule.Common.IdeState({
            files: [{ path: './index.js', content }],
            defaultFileSystem: Promise.resolve(new Map<string, string>()),
        })
        const editor = new this.CodeEditorModule.Common.CodeEditorView({
            ideState,
            path: './index.js',
            language: 'javascript',
        })
        editor.nativeEditor$.pipe(delay(100)).subscribe((nativeEdtr) => {
            nativeEdtr.refresh()
        })
        const generateButton = new GenerateButton({
            projectsState: this.projectsState,
            projectTemplate: this.projectTemplate,
            file$: ideState.updates$['./index.js'],
        })

        generateButton.error$.subscribe(() => {
            params.onError()
        })
        this.children = [editor, generateButton]
    }
}

/**
 * @category View
 */
export class GenerateButton {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = `${classesButton} mx-auto px-4`

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        width: 'fit-content',
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    /**
     * @group Immutable DOM Constants
     */
    public readonly onclick: (ev: MouseEvent) => void

    /**
     * @group Observables
     */
    public readonly error$ = new Subject<HTTPError>()

    constructor({
        projectsState,
        projectTemplate,
        file$,
    }: {
        projectsState: ProjectsState
        projectTemplate: pyYw.Routers.Environment.ProjectTemplate
        file$: BehaviorSubject<{
            path: string
            content: string
        }>
    }) {
        const creating$ = new BehaviorSubject(false)
        this.children = [
            {
                innerText: 'Generate',
            },
            {
                class: attr$(creating$, (creating) =>
                    creating ? 'fas fa-spinner fa-spin ml-1' : '',
                ),
            },
        ]
        this.onclick = () => {
            creating$.next(true)
            projectsState
                .createProjectFromTemplate$({
                    type: projectTemplate.type,
                    parameters: JSON.parse(file$.getValue().content),
                })
                .pipe(
                    tap(() => creating$.next(false)),
                    dispatchHTTPErrors(this.error$),
                )
                .subscribe((resp: pyYw.Routers.Projects.Project) => {
                    projectsState.openProject(resp)
                })
        }
    }
}
