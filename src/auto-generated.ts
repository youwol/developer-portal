
const runTimeDependencies = {
    "externals": {
        "rxjs": "^7.5.6",
        "@youwol/http-clients": "^3.0.0",
        "@youwol/http-primitives": "^0.2.0",
        "@youwol/local-youwol-client": "^0.2.0",
        "@youwol/webpm-client": "^3.0.0",
        "@youwol/rx-vdom": "^1.0.1",
        "@youwol/rx-group-views": "^0.3.0",
        "@youwol/rx-input-views": "^0.3.0",
        "@youwol/rx-button-views": "^0.2.0",
        "@youwol/rx-tree-views": "^0.3.0",
        "@youwol/rx-tab-views": "^0.3.0",
        "@youwol/os-top-banner": "^0.2.0",
        "@youwol/os-widgets": "^0.2.2",
        "d3": "^7.7.0",
        "codemirror": "^5.52.0",
        "@youwol/rx-code-mirror-editors": "^0.4.1",
        "@youwol/grapes-coding-playgrounds": "^0.2.0"
    },
    "includedInBundle": {
        "d3-dag": "0.8.2"
    }
}
const externals = {
    "rxjs": "window['rxjs_APIv7']",
    "@youwol/http-clients": "window['@youwol/http-clients_APIv3']",
    "@youwol/http-primitives": "window['@youwol/http-primitives_APIv02']",
    "@youwol/local-youwol-client": "window['@youwol/local-youwol-client_APIv02']",
    "@youwol/webpm-client": "window['@youwol/webpm-client_APIv3']",
    "@youwol/rx-vdom": "window['@youwol/rx-vdom_APIv1']",
    "@youwol/rx-group-views": "window['@youwol/rx-group-views_APIv03']",
    "@youwol/rx-input-views": "window['@youwol/rx-input-views_APIv03']",
    "@youwol/rx-button-views": "window['@youwol/rx-button-views_APIv02']",
    "@youwol/rx-tree-views": "window['@youwol/rx-tree-views_APIv03']",
    "@youwol/rx-tab-views": "window['@youwol/rx-tab-views_APIv03']",
    "@youwol/os-top-banner": "window['@youwol/os-top-banner_APIv02']",
    "@youwol/os-widgets": "window['@youwol/os-widgets_APIv02']",
    "d3": "window['d3_APIv7']",
    "codemirror": "window['CodeMirror_APIv5']",
    "@youwol/rx-code-mirror-editors": "window['@youwol/rx-code-mirror-editors_APIv04']",
    "@youwol/grapes-coding-playgrounds": "window['@youwol/grapes-coding-playgrounds_APIv02']",
    "rxjs/operators": "window['rxjs_APIv7']['operators']"
}
const exportedSymbols = {
    "rxjs": {
        "apiKey": "7",
        "exportedSymbol": "rxjs"
    },
    "@youwol/http-clients": {
        "apiKey": "3",
        "exportedSymbol": "@youwol/http-clients"
    },
    "@youwol/http-primitives": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/http-primitives"
    },
    "@youwol/local-youwol-client": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/local-youwol-client"
    },
    "@youwol/webpm-client": {
        "apiKey": "3",
        "exportedSymbol": "@youwol/webpm-client"
    },
    "@youwol/rx-vdom": {
        "apiKey": "1",
        "exportedSymbol": "@youwol/rx-vdom"
    },
    "@youwol/rx-group-views": {
        "apiKey": "03",
        "exportedSymbol": "@youwol/rx-group-views"
    },
    "@youwol/rx-input-views": {
        "apiKey": "03",
        "exportedSymbol": "@youwol/rx-input-views"
    },
    "@youwol/rx-button-views": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/rx-button-views"
    },
    "@youwol/rx-tree-views": {
        "apiKey": "03",
        "exportedSymbol": "@youwol/rx-tree-views"
    },
    "@youwol/rx-tab-views": {
        "apiKey": "03",
        "exportedSymbol": "@youwol/rx-tab-views"
    },
    "@youwol/os-top-banner": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/os-top-banner"
    },
    "@youwol/os-widgets": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/os-widgets"
    },
    "d3": {
        "apiKey": "7",
        "exportedSymbol": "d3"
    },
    "codemirror": {
        "apiKey": "5",
        "exportedSymbol": "CodeMirror"
    },
    "@youwol/rx-code-mirror-editors": {
        "apiKey": "04",
        "exportedSymbol": "@youwol/rx-code-mirror-editors"
    },
    "@youwol/grapes-coding-playgrounds": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/grapes-coding-playgrounds"
    }
}

const mainEntry : {entryFile: string,loadDependencies:string[]} = {
    "entryFile": "./app/index.html",
    "loadDependencies": [
        "rxjs",
        "@youwol/http-clients",
        "@youwol/http-primitives",
        "@youwol/local-youwol-client",
        "@youwol/webpm-client",
        "@youwol/rx-vdom",
        "@youwol/rx-group-views",
        "@youwol/rx-input-views",
        "@youwol/rx-button-views",
        "@youwol/rx-tree-views",
        "@youwol/rx-tab-views",
        "@youwol/os-top-banner",
        "@youwol/os-widgets",
        "d3",
        "codemirror",
        "@youwol/rx-code-mirror-editors",
        "@youwol/grapes-coding-playgrounds"
    ]
}

const secondaryEntries : {[k:string]:{entryFile: string, name: string, loadDependencies:string[]}}= {}

const entries = {
     '@youwol/developer-portal': './app/index.html',
    ...Object.values(secondaryEntries).reduce( (acc,e) => ({...acc, [`@youwol/developer-portal/${e.name}`]:e.entryFile}), {})
}
export const setup = {
    name:'@youwol/developer-portal',
        assetId:'QHlvdXdvbC9kZXZlbG9wZXItcG9ydGFs',
    version:'0.2.2-wip',
    shortDescription:"Developer portal",
    developerDocumentation:'https://platform.youwol.com/applications/@youwol/cdn-explorer/latest?package=@youwol/developer-portal&tab=doc',
    npmPackage:'https://www.npmjs.com/package/@youwol/developer-portal',
    sourceGithub:'https://github.com/youwol/developer-portal',
    userGuide:'https://l.youwol.com/doc/@youwol/developer-portal',
    apiVersion:'02',
    runTimeDependencies,
    externals,
    exportedSymbols,
    entries,
    secondaryEntries,
    getDependencySymbolExported: (module:string) => {
        return `${exportedSymbols[module].exportedSymbol}_APIv${exportedSymbols[module].apiKey}`
    },

    installMainModule: ({cdnClient, installParameters}:{
        cdnClient:{install:(unknown) => Promise<WindowOrWorkerGlobalScope>},
        installParameters?
    }) => {
        const parameters = installParameters || {}
        const scripts = parameters.scripts || []
        const modules = [
            ...(parameters.modules || []),
            ...mainEntry.loadDependencies.map( d => `${d}#${runTimeDependencies.externals[d]}`)
        ]
        return cdnClient.install({
            ...parameters,
            modules,
            scripts,
        }).then(() => {
            return window[`@youwol/developer-portal_APIv02`]
        })
    },
    installAuxiliaryModule: ({name, cdnClient, installParameters}:{
        name: string,
        cdnClient:{install:(unknown) => Promise<WindowOrWorkerGlobalScope>},
        installParameters?
    }) => {
        const entry = secondaryEntries[name]
        if(!entry){
            throw Error(`Can not find the secondary entry '${name}'. Referenced in template.py?`)
        }
        const parameters = installParameters || {}
        const scripts = [
            ...(parameters.scripts || []),
            `@youwol/developer-portal#0.2.2-wip~dist/@youwol/developer-portal/${entry.name}.js`
        ]
        const modules = [
            ...(parameters.modules || []),
            ...entry.loadDependencies.map( d => `${d}#${runTimeDependencies.externals[d]}`)
        ]
        return cdnClient.install({
            ...parameters,
            modules,
            scripts,
        }).then(() => {
            return window[`@youwol/developer-portal/${entry.name}_APIv02`]
        })
    },
    getCdnDependencies(name?: string){
        if(name && !secondaryEntries[name]){
            throw Error(`Can not find the secondary entry '${name}'. Referenced in template.py?`)
        }
        const deps = name ? secondaryEntries[name].loadDependencies : mainEntry.loadDependencies

        return deps.map( d => `${d}#${runTimeDependencies.externals[d]}`)
    }
}
