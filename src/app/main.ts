import { install } from '@youwol/cdn-client'

export {}
require('./style.css')

await install(
    {
        modules: [
            'lodash',
            '@youwol/flux-view',
            '@youwol/fv-group',
            '@youwol/fv-input',
            '@youwol/fv-button',
            '@youwol/fv-tree',
            '@youwol/fv-tabs',
            '@youwol/http-clients',
            '@youwol/platform-essentials',
            'd3',
            'rxjs',
        ],
        scripts: [
            'codemirror#5.52.0~codemirror.min.js',
            'codemirror#5.52.0~mode/python.min.js',
        ],
        css: [
            'bootstrap#4.4.1~bootstrap.min.css',
            'fontawesome#5.12.1~css/all.min.css',
            '@youwol/fv-widgets#latest~dist/assets/styles/style.youwol.css',
            'codemirror#5.52.0~codemirror.min.css',
            'codemirror#5.52.0~theme/blackboard.min.css',
        ],
    },
    {
        displayLoadingScreen: true,
    },
)
await import('./on-load')
