import { AnyVirtualDOM, ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { ProjectsState } from '../projects.state'
import {
    filterCtxMessage,
    HTTPError,
    dispatchHTTPErrors,
} from '@youwol/http-primitives'
import * as pyYw from '@youwol/local-youwol-client'
import { BehaviorSubject, from, Observable, Subject } from 'rxjs'
import { install } from '@youwol/webpm-client'
import { delay, map, shareReplay, tap } from 'rxjs/operators'
import { classesButton, LogsTab } from '../../common'
import { DockableTabs } from '@youwol/rx-tab-views'

declare type CodeEditorModule = typeof import('@youwol/rx-code-mirror-editors')

/**
 * Lazy loading of the module `@youwol/fv-code-mirror-editors`
 *
 * @category HTTP
 */
export const loadFvCodeEditorsModule$: () => Observable<CodeEditorModule> =
    () =>
        from(
            install({
                modules: ['@youwol/rx-code-mirror-editors#^0.4.1'],
                scripts: ['codemirror#5.52.0~mode/javascript.min.js'],
                css: [
                    'codemirror#5.52.0~codemirror.min.css',
                    'codemirror#5.52.0~theme/blackboard.min.css',
                ],
                aliases: {
                    codeMirrorEditors: '@youwol/rx-code-mirror-editors',
                },
            }),
        ).pipe(
            map((window) => window['codeMirrorEditors']),
            shareReplay({ bufferSize: 1, refCount: true }),
        )

/**
 * @category View
 */
export class NewProjectFromTemplateView implements VirtualDOM<'div'> {
    static loadFvCodeEditors$ = loadFvCodeEditorsModule$()

    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'd-flex flex-column w-100 h-100'

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        position: 'relative' as const,
    }

    /**
     * @group Immutable Constants
     */
    public readonly id: string

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

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
                tag: 'div',
                class: 'w-100 h-100 py-2 overflow-auto',
                style: { minHeight: '0px' },
                children: [
                    new ProjectTemplateHeaderView(params),

                    {
                        source$: NewProjectFromTemplateView.loadFvCodeEditors$,
                        vdomMap: (CodeEditorModule: CodeEditorModule) => {
                            return new ProjectTemplateEditor({
                                projectsState: this.projectsState,
                                CodeEditorModule: CodeEditorModule,
                                projectTemplate: this.projectTemplate,
                                onError: () => viewState$.next('expanded'),
                            })
                        },
                    },
                ],
            },
            bottomNav,
        ]
    }
}

/**
 * @category View
 */
export class ProjectTemplateHeaderView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

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
    public readonly children: ChildrenLike

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
                tag: 'div',
                class: 'd-flex align-items-center p-1',
                children: [
                    this.projectTemplate.icon as AnyVirtualDOM,
                    { tag: 'div', class: 'px-2' },
                    {
                        tag: 'div',
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
export class ProjectTemplateEditor implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-50 h-50 mx-auto'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

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
export class GenerateButton implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
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
    public readonly children: ChildrenLike

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
                tag: 'div',
                innerText: 'Generate',
            },
            {
                tag: 'div',
                class: {
                    source$: creating$,
                    vdomMap: (creating) =>
                        creating ? 'fas fa-spinner fa-spin ml-1' : '',
                },
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
