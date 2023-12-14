import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
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
import { BehaviorSubject, combineLatest, map } from 'rxjs'
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
export class CdnTabView implements VirtualDOM<'div'> {
    /**
     * @group States
     */
    public readonly cdnState: CdnState

    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

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
    public readonly children: ChildrenLike

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
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

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
                tag: 'div',
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
export class PackageItemView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

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
    public readonly children: ChildrenLike

    constructor(params: { cdnState: CdnState; packageId: string }) {
        Object.assign(this, params)
        const name = window.atob(this.packageId)
        this.children = [
            {
                tag: 'div',
                class: leftNavSectionAttr$({
                    selectedScreen$: params.cdnState.appState.selectedScreen$,
                    targetTopic: 'CDN',
                    targetViewId: this.packageId,
                }),
                children: [
                    {
                        tag: 'div',
                        innerText: name,
                    },
                    {
                        tag: 'div',
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
    public readonly tag = 'div'

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
                title: {
                    source$: cdnState.openPackages$,
                    vdomMap: (packages: string[]) =>
                        `Opened packages (${packages.length})`,
                },
                icon: 'fas fa-folder-open',
            }),
            content: {
                tag: 'div',
                class: 'pl-4 flex-grow-1 overflow-auto',
                children: {
                    policy: 'replace',
                    source$: cdnState.openPackages$,
                    vdomMap: (packages: string[]) => {
                        return packages.map(
                            (packageId) =>
                                new PackageItemView({ packageId, cdnState }),
                        )
                    },
                },
            },
        })
    }
}

/**
 * @category View
 */
export class ContentView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
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
    public readonly children: ChildrenLike

    constructor({ cdnState }: { cdnState: CdnState }) {
        const searchView: VirtualDOM<'div'> = {
            tag: 'div',
            class: 'd-flex align-items-center  my-2 w-100 px-2',
            children: [
                {
                    tag: 'div',
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
                    oninput: (ev) => this.search$.next(ev.target['value']),
                },
            ],
        }

        this.children = [
            searchView,
            {
                tag: 'div',
                children: {
                    policy: 'replace',
                    source$: combineLatest([
                        cdnState.packages$,
                        this.search$,
                    ]).pipe(
                        map(([projects, search]) => {
                            return projects.filter((p) =>
                                p.name.includes(search),
                            )
                        }),
                    ),
                    vdomMap: (packages: (ActualPackage | FuturePackage)[]) => {
                        return packages.map(
                            (pack) =>
                                new CdnPackageItemView({
                                    item: pack,
                                    cdnState,
                                }),
                        )
                    },
                },
            },
        ]
    }
}

/**
 * @category View
 */
export class CdnPackageItemView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag: 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class =
        'fv-pointer fv-hover-bg-background-alt rounded px-1 d-flex align-items-center'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

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
                      tag: 'div',
                      class: `fas ${
                          CdnPackageItemView.icons[this.item.event]
                      } mr-2`,
                  }
                : undefined,
            {
                tag: 'div',
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
    public readonly tag: 'div'

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
                title: {
                    source$: cdnState.packages$,
                    vdomMap: (packages: (ActualPackage | FuturePackage)[]) =>
                        `All packages (${
                            packages.filter((p) => p instanceof ActualPackage)
                                .length
                        })`,
                },
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
