import { attr$, children$, VirtualDOM } from '@youwol/flux-view'
import {
    commonClassesLeftSideNav,
    leftNavSectionAttr$,
    leftTabWidth,
    Section,
    SectionHeader,
    LeftNavTab,
} from '../common'
import { CdnState, FuturePackage, ActualPackage } from './cdn.state'
import { DashboardView } from './dashboard'
import { BehaviorSubject, combineLatest } from 'rxjs'
import { map } from 'rxjs/operators'

import * as pyYw from '@youwol/local-youwol-client'
import { UpdatesView } from './updates'

/**
 * @category View
 */
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

/**
 * @category View
 */
export class CdnTabView implements VirtualDOM {
    /**
     * @group States
     */
    public readonly cdnState: CdnState

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = commonClassesLeftSideNav

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        width: leftTabWidth,
    }

    /**
     * @group Immutable DOM Constants
     */
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

/**
 * @category View
 */
export class SectionDashboard extends Section {
    /**
     * @group States
     */
    public readonly cdnState: CdnState

    /**
     * @group Immutable DOM Constants
     */
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
                icon: 'fas fa-th-large fv-pointer',
            }),
        })
        Object.assign(this, params)
    }
}

/**
 * @category View
 */
export class PackageItemView {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'fv-pointer'

    /**
     * @group States
     */
    public readonly cdnState: CdnState

    /**
     * @group Immutable Constants
     */
    public readonly packageId: string

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(params: { cdnState: CdnState; packageId: string }) {
        Object.assign(this, params)
        const name = window.atob(this.packageId)
        this.children = [
            {
                class: leftNavSectionAttr$({
                    selectedScreen$: params.cdnState.appState.selectedScreen$,
                    targetTopic: 'CDN',
                    targetViewId: this.packageId,
                }),
                children: [
                    {
                        innerText: name,
                    },
                    {
                        class: 'fas fa-times fv-text-error fv-xx-darker fv-hover-xx-lighter pl-2 mx-2',
                        onclick: (ev) => {
                            ev.stopPropagation()
                            this.cdnState.closePackage(this.packageId)
                        },
                    },
                ],
                onclick: () => {
                    this.cdnState.selectProject(this.packageId)
                },
            },
        ]
    }
}

/**
 * @category View
 */
class SectionPackagesOpened extends Section {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'my-2 d-flex flex-column'

    /**
     * @group Immutable DOM Constants
     */
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
                icon: 'fas fa-folder-open',
            }),
            content: {
                class: 'pl-4 flex-grow-1 overflow-auto',
                children: children$(cdnState.openPackages$, (packages) => {
                    return packages.map(
                        (packageId) =>
                            new PackageItemView({ packageId, cdnState }),
                    )
                }),
            },
        })
    }
}

/**
 * @category View
 */
export class ContentView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'pl-4 flex-grow-1 overflow-auto'

    /**
     * @group Observables
     */
    public readonly search$ = new BehaviorSubject('')

    /**
     * @group Immutable DOM Constants
     */
    public readonly children

    constructor({ cdnState }: { cdnState: CdnState }) {
        const searchView = {
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
                    (packages: (ActualPackage | FuturePackage)[]) => {
                        return packages.map(
                            (pack) =>
                                new CdnPackageItemView({
                                    item: pack,
                                    cdnState,
                                }),
                        )
                    },
                ),
            },
        ]
    }
}

/**
 * @category View
 */
export class CdnPackageItemView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class =
        'fv-pointer fv-hover-bg-background-alt rounded px-1 d-flex align-items-center'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    /**
     * @group Immutable Constants
     */
    public readonly item: ActualPackage | FuturePackage

    /**
     * @group States
     */
    public readonly cdnState: CdnState

    /**
     * @group Immutable Constants
     */
    static icons: Record<pyYw.Routers.System.DownloadEventType, string> = {
        enqueued: 'fa-hourglass-start fv-text-disabled',
        started: 'fa-cloud-download-alt fv-blink  fv-text-focus',
        succeeded: 'fa-check fv-text-success',
        failed: 'fa-times fv-text-error',
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly onclick = () => {
        if (this.item instanceof ActualPackage) {
            this.cdnState.openPackage(this.item.id)
        }
    }

    constructor(params: {
        item: ActualPackage | FuturePackage
        cdnState: CdnState
    }) {
        Object.assign(this, params)
        this.children = [
            this.item instanceof FuturePackage
                ? {
                      class: `fas ${
                          CdnPackageItemView.icons[this.item.event]
                      } mr-2`,
                  }
                : undefined,
            {
                class:
                    this.item instanceof FuturePackage
                        ? 'fv-text-disabled'
                        : '',
                innerText: this.item.name,
            },
        ]
    }
}

/**
 * @category View
 */
export class SectionAllPackages extends Section {
    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        minHeight: '0px',
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'my-2 flex-grow-1 d-flex flex-column'

    constructor({ cdnState }: { cdnState: CdnState }) {
        super({
            header: new SectionHeader({
                title: attr$(
                    cdnState.packages$,
                    (packages) =>
                        `All packages (${
                            packages.filter((p) => p instanceof ActualPackage)
                                .length
                        })`,
                ),
                icon: 'fas fa-list-alt',
            }),
            content: new ContentView({ cdnState }),
        })
    }
}

/**
 * @category View
 */
export class SectionUpgrades extends Section {
    /**
     * @group States
     */
    public readonly cdnState: CdnState

    /**
     * @group Immutable DOM Constants
     */
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
                icon: 'fas fa-download fv-pointer',
            }),
        })
        Object.assign(this, params)
    }
}
