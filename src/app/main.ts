export { }
require('./style.css');

let cdn = window['@youwol/cdn-client']

var loadingScreen = new cdn.LoadingScreenView({ container: document.body, mode: 'svg' })
loadingScreen.render()

await cdn.install({
    modules: [
        'lodash',
        '@youwol/flux-view',
        '@youwol/fv-group',
        '@youwol/fv-input',
        '@youwol/fv-button',
        '@youwol/fv-tree',
        '@youwol/fv-tabs',
        '@youwol/platform-essentials',
        '@youwol/flux-youwol-essentials',
        '@youwol/flux-files',
        'd3',
        'rxjs'
    ],
    scripts: [
        "codemirror#5.52.0~codemirror.min.js",
        "codemirror#5.52.0~mode/python.min.js"
    ],
    css: [
        "bootstrap#4.4.1~bootstrap.min.css",
        "fontawesome#5.12.1~css/all.min.css",
        "@youwol/fv-widgets#latest~dist/assets/styles/style.youwol.css",
        "codemirror#5.52.0~codemirror.min.css",
        "codemirror#5.52.0~theme/blackboard.min.css",
    ]
}, window, (event) => {
    loadingScreen.next(event)
})
loadingScreen.done()
await import('./on-load')
