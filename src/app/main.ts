import { install } from '@youwol/cdn-client'
import { setup } from '../auto-generated'
export {}
require('./style.css')

await install({
    modules: Object.entries(setup.runTimeDependencies.load)
        .filter(
            ([k]) => !setup.runTimeDependencies.includedInBundle.includes(k),
        )
        .map(([k, v]) => `${k}#${v}`),
    scripts: ['codemirror#5.52.0~mode/python.min.js'],
    css: [
        'bootstrap#4.4.1~bootstrap.min.css',
        'fontawesome#5.12.1~css/all.min.css',
        '@youwol/fv-widgets#latest~dist/assets/styles/style.youwol.css',
        'codemirror#5.52.0~codemirror.min.css',
        'codemirror#5.52.0~theme/blackboard.min.css',
    ],
    displayLoadingScreen: true,
})
await import('./on-load')
