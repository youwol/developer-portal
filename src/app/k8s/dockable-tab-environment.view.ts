import { VirtualDOM } from '@youwol/flux-view'
import {
    commonClassesLeftSideNav,
    leftNavSectionAttr$,
    leftTabWidth,
    Section,
    SectionHeader,
} from '../common/utils-view'
import { K8sState } from './k8s.state'
import { DashboardView } from './dashboard/dashboard.view'
import { LeftNavTab } from '../common/left-nav-tabs'

export class K8sTab extends LeftNavTab<K8sState, K8sTabView> {
    constructor(params: { k8sState: K8sState }) {
        super({
            topic: 'K8s',
            title: 'K8s',
            icon: 'fas fa-cloud-meatball',
            defaultViewId: 'dashboard',
            defaultView: () =>
                new DashboardView({
                    k8sState: params.k8sState,
                }),
            state: params.k8sState,
            content: () => {
                return new K8sTabView({
                    k8sState: params.k8sState,
                })
            },
        })
    }
}

export class K8sTabView implements VirtualDOM {
    public readonly k8sState: K8sState
    public readonly class = commonClassesLeftSideNav
    public readonly style = {
        width: leftTabWidth,
    }
    public readonly children: VirtualDOM[]

    constructor(params: { k8sState: K8sState }) {
        Object.assign(this, params)

        this.children = [new SectionDashboard({ k8sState: this.k8sState })]
    }
}

class SectionDashboard extends Section {
    public readonly k8sState: K8sState
    public readonly onclick = () => {
        this.k8sState.appState.registerScreen({
            topic: 'K8s',
            viewId: 'dashboard',
            view: new DashboardView({
                k8sState: this.k8sState,
            }),
        })
    }
    constructor(params: { k8sState: K8sState }) {
        super({
            header: new SectionHeader({
                class: leftNavSectionAttr$({
                    selectedScreen$: params.k8sState.appState.selectedScreen$,
                    targetTopic: 'K8s',
                    targetViewId: 'dashboard',
                }),
                title: 'Dashboard',
                icon: 'fa-th-large fv-pointer',
            }),
        })
        Object.assign(this, params)
    }
}
