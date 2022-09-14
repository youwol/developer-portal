import { attr$, child$, VirtualDOM } from '@youwol/flux-view'
import { ProjectsState } from '../projects.state'
import { PyYouwol as pyYw } from '@youwol/http-clients'
import { BehaviorSubject, from, Observable } from 'rxjs'
import { install } from '@youwol/cdn-client'
import { delay, map, shareReplay } from 'rxjs/operators'
import { classesButton } from '../../common'

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
                modules: ['@youwol/fv-code-mirror-editors#^0.0.2'],
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
    public readonly projectTemplate: pyYw.ProjectTemplate

    constructor(params: {
        projectsState: ProjectsState
        projectTemplate: pyYw.ProjectTemplate
    }) {
        Object.assign(this, params)

        const file$ = new BehaviorSubject({
            path: './config.js',
            content: JSON.stringify(this.projectTemplate.parameters, null, 4),
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
                                file$,
                            })
                        },
                    ),
                    {
                        class: `${classesButton} mx-auto px-4`,
                        children: [
                            {
                                innerText: 'Generate',
                            },
                            {
                                class: attr$(
                                    this.projectsState.creatingProjects$,
                                    (types) =>
                                        types.includes(
                                            this.projectTemplate.type,
                                        )
                                            ? 'fas fa-spinner fa-spin ml-1'
                                            : '',
                                ),
                            },
                        ],
                        style: {
                            width: 'fit-content',
                        },
                        onclick: () => {
                            this.projectsState.createProjectFromTemplate({
                                type: params.projectTemplate.type,
                                parameters: JSON.parse(
                                    file$.getValue().content,
                                ),
                            })
                        },
                    },
                ],
            },
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
    public readonly projectTemplate: pyYw.ProjectTemplate

    constructor(params: {
        projectsState: ProjectsState
        projectTemplate: pyYw.ProjectTemplate
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

    constructor(params: {
        projectsState: ProjectsState
        CodeEditorModule: CodeEditorModule
        file$: BehaviorSubject<{
            path: string
            content: string
        }>
    }) {
        Object.assign(this, params)
        const editor = new params.CodeEditorModule.CodeEditorView({
            file$: params.file$,
            language: 'javascript',
        })
        editor.nativeEditor$.pipe(delay(100)).subscribe((nativeEdtr) => {
            nativeEdtr.refresh()
        })
        this.children = [editor]
    }
}
