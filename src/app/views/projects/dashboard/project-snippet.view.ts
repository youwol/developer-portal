import { VirtualDOM } from '@youwol/flux-view'
import { AppState } from '../../../app-state'
import { Project } from '../../../client/models'

export class ProjectSnippetView {
    public readonly class =
        'rounded p-2 fv-pointer fv-border-primary fv-hover-border-focus text-center m-3'
    public readonly style = {
        height: 'fit-content',
    }
    public readonly children: VirtualDOM[]

    public readonly state: AppState
    public readonly project: Project

    public readonly onclick: (ev: MouseEvent) => void

    constructor(params: { project: Project; state: AppState }) {
        Object.assign(this, params)

        this.children = [
            {
                tag: 'h4',
                innerText: this.project.name,
            },
            {
                tag: 'h5',
                innerText: this.project.version,
            },
            {
                tag: 'h5',
                innerText: this.project.pipeline.target.family,
            },
            {
                class: 'w-100 d-flex align-items-center',
                children: this.project.pipeline.tags.map((t) => ({
                    class: 'px-2',
                    innerText: t,
                })),
            },
        ]
        this.onclick = () => {
            this.state.openProject(this.project)
        }
    }
}
