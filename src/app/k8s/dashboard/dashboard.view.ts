import { child$, VirtualDOM } from '@youwol/flux-view'
import { PyYouwol as pyYw } from '@youwol/http-clients'
import {
    AttributeTitleView,
    AttributeValueView,
    AttributeView,
    DashboardTitle,
    TableView,
} from '../../common/utils-view'
import { K8sState } from '../k8s.state'

export class DashboardView implements VirtualDOM {
    public readonly k8sState: K8sState
    public readonly class = 'w-100 h-100 p-2 overflow-auto'
    public readonly children: VirtualDOM[]

    constructor(params: { k8sState: K8sState }) {
        Object.assign(this, params)
        this.children = [
            child$(this.k8sState.appState.environment$, (environment) => {
                return new EnvSummaryView({
                    k8sInstance: environment.configuration.k8sInstance,
                })
            }),
        ]
    }
}

export class EnvSummaryView implements VirtualDOM {
    public readonly k8sInstance: pyYw.K8sInstance
    public readonly children: VirtualDOM[]

    constructor(params: { k8sInstance: pyYw.K8sInstance }) {
        Object.assign(this, params)
        this.children = [
            new KubeConfigView({
                configFile: this.k8sInstance.configFile,
                contextName: this.k8sInstance.contextName,
            }),
            new InstanceInfoView({
                k8sInstanceInfo: this.k8sInstance.instanceInfo,
            }),
            new OpenIdConnectView({
                openId: this.k8sInstance.openIdConnect,
            }),
            new DockersView({ docker: this.k8sInstance.docker }),
        ]
    }
}

export class InstanceInfoView implements VirtualDOM {
    public readonly class = 'mb-4'
    public readonly k8sInstanceInfo: pyYw.K8sInstanceInfo
    public readonly children: VirtualDOM[]

    constructor(params: { k8sInstanceInfo: pyYw.K8sInstanceInfo }) {
        Object.assign(this, params)
        this.children = [
            new K8sDashboardUrlView({
                url: `${this.k8sInstanceInfo.k8s_api_proxy}/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/#/pod?namespace=_all`,
            }),

            new AttributeView({
                text: 'Access token',
                value: this.k8sInstanceInfo.access_token,
            }),
            new NodesView({ nodes: this.k8sInstanceInfo.nodes }),
        ]
    }
}

class KubeConfigView implements VirtualDOM {
    public readonly class = ''
    public readonly configFile: string
    public readonly contextName: string
    public readonly children: VirtualDOM[]

    constructor(params: { configFile: string; contextName: string }) {
        Object.assign(this, params)
        this.children = [
            new AttributeView({ text: 'Config. file', value: this.configFile }),
            new AttributeView({ text: 'Context', value: this.contextName }),
        ]
    }
}

export class OpenIdConnectView implements VirtualDOM {
    public readonly class = 'mb-4'
    public readonly children: VirtualDOM[]
    public readonly openId: pyYw.OpenIdConnect

    constructor(params: { openId: pyYw.OpenIdConnect }) {
        Object.assign(this, params)
        this.children = [
            new DashboardTitle({ title: 'OpenId Connect' }),
            new AttributeView({ text: 'host', value: this.openId.host }),
            new AttributeView({
                text: 'secret',
                value: this.openId.authSecret,
            }),
        ]
    }
}

export class DockersView implements VirtualDOM {
    public readonly class = 'mb-4'
    public readonly children: VirtualDOM[]
    public readonly docker: pyYw.K8sDockerRepositories

    constructor(params: { docker: pyYw.K8sDockerRepositories }) {
        Object.assign(this, params)
        this.children = [
            new DashboardTitle({ title: 'Docker repositories' }),
            ...this.docker.repositories.map((docker) => {
                return new AttributeView({
                    text: docker.name,
                    value: docker.pullSecret,
                })
            }),
        ]
    }
}

export class K8sDashboardUrlView implements VirtualDOM {
    public readonly class = 'd-flex align-items-center'
    public readonly url: string
    public readonly children: VirtualDOM[]

    constructor(params: { url: string }) {
        Object.assign(this, params)
        this.children = [
            new AttributeTitleView({ text: 'K8s dashboard' }),
            new AttributeValueView({
                value: this.url,
                tag: 'a',
                href: this.url,
                innerText: "K8s' dashboard",
            }),
        ]
    }
}

export class NodesView implements VirtualDOM {
    public readonly class = 'my-3'
    public readonly nodes: pyYw.K8sNodeInfo[]
    public readonly children: VirtualDOM[]

    constructor(params: { nodes: pyYw.K8sNodeInfo[] }) {
        Object.assign(this, params)
        this.children = [
            new DashboardTitle({ title: 'Nodes' }),
            new TableView({
                columns: Object.entries({
                    Architecture: (n) => n.architecture,
                    CPU: (n) => n.cpu,
                    Kernel: (n) => n.kernelVersion,
                    Memory: (n) => n.memory,
                    OS: (n) => n.operating_system,
                }).map(([k, v]) => ({
                    name: k,
                    property: v,
                })),
                items: this.nodes as any,
            }),
        ]
    }
}
