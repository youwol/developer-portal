import { attr$, children$, VirtualDOM } from '@youwol/flux-view'
import {
    leftNavSectionAttr$,
    Section,
    SectionHeader,
} from '../common/utils-view'
import { CdnState } from './cdn.state'
import { DashboardView } from './dashboard/dashboard.view'
import { BehaviorSubject, combineLatest } from 'rxjs'
import { map } from 'rxjs/operators'

import { PyYouwol as pyYw } from '@youwol/http-clients'
import { UpdatesView } from './updates/updates.view'
import { LeftNavTab } from '../common/left-nav-tabs'

export class CdnTab extends LeftNavTab<CdnState, CdnTabView> {
    constructor(params: { cdnState: CdnState }) {
        super({
            topic: 'CDN',
            title: 'CDN',
            icon: 'fas fa-cubes',
            defaultViewId: 'dashboard',
            defaultView: () =>
                new DashboardView({
                    cdnState: params.cdnState,
                }),
            state: params.cdnState,
            content: () => {
                return new CdnTabView({ cdnState: params.cdnState })
            },
        })
    }
}

export class CdnTabView implements VirtualDOM {
    public readonly cdnState: CdnState
    public readonly class = 'p-2 d-flex flex-column h-100'
    public readonly style = {
        minHeight: '0px',
    }
    public readonly children: VirtualDOM[]

    constructor(params: { cdnState: CdnState }) {
        Object.assign(this, params)

        this.children = [
            new SectionDashboard({ cdnState: this.cdnState }),
            new SectionUpgrades({ cdnState: this.cdnState }),
            new SectionPackagesOpened({ cdnState: this.cdnState }),
            new SectionAllPackages({ cdnState: this.cdnState }),
        ]
    }
}

class SectionDashboard extends Section {
    public readonly cdnState: CdnState
    public readonly onclick = () => {
        this.cdnState.appState.registerScreen({
            topic: 'CDN',
            viewId: 'dashboard',
            view: new DashboardView({ cdnState: this.cdnState }),
        })
    }
    constructor(params: { cdnState: CdnState }) {
        super({
            header: new SectionHeader({
                class: leftNavSectionAttr$({
                    selectedScreen$: params.cdnState.appState.selectedScreen$,
                    targetTopic: 'CDN',
                    targetViewId: 'dashboard',
                }),
                title: 'Dashboard',
                icon: 'fa-th-large fv-pointer',
            }),
        })
        Object.assign(this, params)
    }
}

class PackageItemView {
    public readonly class = 'fv-pointer'
    public readonly cdnState: CdnState
    public readonly package: pyYw.CdnPackage
    public readonly children: VirtualDOM[]

    constructor(params: { cdnState: CdnState; package: pyYw.CdnPackage }) {
        Object.assign(this, params)
        this.children = [
            {
                class: leftNavSectionAttr$({
                    selectedScreen$: params.cdnState.appState.selectedScreen$,
                    targetTopic: 'CDN',
                    targetViewId: this.package.name,
                }),
                children: [
                    {
                        innerText: this.package.name,
                    },
                    {
                        class: 'fas fa-times fv-text-error fv-xx-darker fv-hover-xx-lighter pl-2 mx-2',
                        onclick: (ev) => {
                            ev.stopPropagation()
                            this.cdnState.closePackage(this.package)
                        },
                    },
                ],
                onclick: () => {
                    this.cdnState.selectProject(this.package.name)
                },
            },
        ]
    }
}
class SectionPackagesOpened extends Section {
    public readonly class = 'my-2 d-flex flex-column'
    public readonly style = {
        maxHeight: '30%',
    }

    constructor({ cdnState }: { cdnState: CdnState }) {
        super({
            header: new SectionHeader({
                title: attr$(
                    cdnState.openPackages$,
                    (packages) => `Opened packages (${packages.length})`,
                ),
                icon: 'fa-folder-open',
            }),
            content: {
                class: 'pl-4 flex-grow-1 overflow-auto',
                children: children$(cdnState.openPackages$, (packages) => {
                    return packages.map(
                        (pack) =>
                            new PackageItemView({ package: pack, cdnState }),
                    )
                }),
            },
        })
    }
}

class ContentView implements VirtualDOM {
    public readonly class = 'pl-4 flex-grow-1 overflow-auto'
    public readonly search$ = new BehaviorSubject('')
    public readonly children

    constructor({ cdnState }: { cdnState: CdnState }) {
        let searchView = {
            class: 'd-flex align-items-center  my-2 w-100 px-2',
            children: [
                {
                    class: 'fas fa-search mr-1',
                },
                {
                    class: 'flex-grow-1',
                    tag: 'input',
                    type: 'text',
                    style: {
                        fontSize: 'small',
                    },
                    value: this.search$.getValue(),
                    oninput: (ev) => this.search$.next(ev.target.value),
                },
            ],
        }

        this.children = [
            searchView,
            {
                children: children$(
                    combineLatest([cdnState.packages$, this.search$]).pipe(
                        map(([projects, search]) => {
                            return projects.filter((p) =>
                                p.name.includes(search),
                            )
                        }),
                    ),
                    (packages: pyYw.CdnPackage[]) => {
                        return packages.map((pack) => ({
                            class: 'fv-pointer fv-hover-bg-background-alt rounded px-1',
                            innerHTML: pack.name,
                            onclick: () => {
                                cdnState.openPackage(pack)
                            },
                        }))
                    },
                ),
            },
        ]
    }
}
class SectionAllPackages extends Section {
    public readonly style = {
        minHeight: '0px',
    }
    public readonly class = 'my-2 flex-grow-1 d-flex flex-column'
    constructor({ cdnState }: { cdnState: CdnState }) {
        super({
            header: new SectionHeader({
                title: attr$(
                    cdnState.packages$,
                    (packages) => `All packages (${packages.length})`,
                ),
                icon: 'fa-list-alt',
            }),
            content: new ContentView({ cdnState }),
        })
    }
}

class SectionUpgrades extends Section {
    public readonly cdnState: CdnState
    public readonly onclick = () => {
        this.cdnState.appState.registerScreen({
            topic: 'CDN',
            viewId: 'upgrades',
            view: new UpdatesView({ cdnState: this.cdnState }),
        })
    }
    constructor(params: { cdnState: CdnState }) {
        super({
            header: new SectionHeader({
                class: leftNavSectionAttr$({
                    selectedScreen$: params.cdnState.appState.selectedScreen$,
                    targetTopic: 'CDN',
                    targetViewId: 'upgrades',
                }),
                title: 'Upgrades',
                icon: 'fa-download fv-pointer',
            }),
        })
        Object.assign(this, params)
    }
}
