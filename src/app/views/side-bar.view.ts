import { attr$, child$, VirtualDOM } from "@youwol/flux-view"
import { BehaviorSubject } from "rxjs"
import { AppState, Topic } from "../app-state"



export class SideBarSectionView implements VirtualDOM {

    public readonly class = 'fv-pointer border w-100 my-2'
    public readonly children: VirtualDOM[]

    public readonly state: AppState

    public readonly name: Topic
    public readonly icon: string

    public readonly onclick: (ev: MouseEvent) => void

    constructor(params: { state: AppState, name: Topic, icon: string }) {

        Object.assign(this, params)
        this.onclick = () => {
            this.state.selectTopic(this.name)
        }
        this.children = [{
            class: attr$(
                this.state.selectedTopic$,
                (topic: Topic) => topic == this.name
                    ? 'fv-bg-secondary'
                    : '',
                { wrapper: (d) => `${d} p-2 fv-hover-xx-lighter fv-hover-bg-secondary d-flex align-items-center` }
            ),
            children: [
                {
                    class: this.icon
                },
                {
                    tag: 'span',
                    class: 'px-2',
                    innerText: this.name
                }
            ]
        }
        ]
    }
}




export class SideBarContentView implements VirtualDOM {

    public readonly children: VirtualDOM[]

    public readonly sections: { name: Topic, icon: string }[] = [
        {
            name: 'Projects',
            icon: 'fas fa-project-diagram'
        },
        {
            name: 'Updates',
            icon: 'fas fa-cloud-download-alt'
        },
        {
            name: 'CDN',
            icon: 'fas fa-database'
        }
    ]
    public readonly state: AppState

    constructor(params: { state: AppState }) {

        Object.assign(this, params)

        this.children = this.sections.map(s => new SideBarSectionView({ ...params, ...s }))
    }
}



export class SideBarView implements VirtualDOM {

    public readonly class = "fv-bg-background  pt-1 border-right h-100"
    public readonly style: any
    public readonly children: VirtualDOM[]

    public readonly extended$ = new BehaviorSubject<boolean>(true)

    public readonly state: AppState

    constructor(params: { state: AppState }) {

        Object.assign(this, params)

        this.style = attr$(
            this.extended$,
            (extended) => extended
                ? {
                    width: '250px'
                } : { width: 'auto' }
        )

        this.children = [
            {
                class: "w-100 fv-text-primary text-right mb-3 p-2",
                children: [
                    {
                        class: 'ml-auto fas fa-bars fv-pointer fv-hover-text-focus',
                        onclick: () => { this.extended$.next(!this.extended$.getValue()) }
                    }
                ]
            },
            child$(
                this.extended$,
                (extended) => extended ? new SideBarContentView(params) : {}
            )
        ]
    }
}
