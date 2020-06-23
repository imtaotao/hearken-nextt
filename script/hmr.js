const fs = require('fs')
const opn = require('opn')
const path = require('path')
const rollup = require('rollup')
const rm = require('rimraf').sync
const replace = require('rollup-plugin-replace')
const resolve = require('rollup-plugin-node-resolve')
const typescript = require('rollup-plugin-typescript2')

const packageJSON = require('../package.json')
const libName = packageJSON.name
const libDir = path.resolve(__dirname, '../dev/lib')
const devHtml = path.resolve(__dirname, '../dev/index.html')
const entryPath = path.resolve(__dirname, '../src/index.ts')
const outputPath = path.resolve(__dirname, '../dev/lib', `${libName}.js`)

const esm = {
  input: entryPath,
  output: {
    format: 'umd',
    name: libName,
    file: outputPath,
    sourcemap: true,
  }
}

const createReplacePlugin = () => {
  return replace({
    __VERSION__: `'${packageJSON.version}'`,
  })
}

async function build (cfg, type) {
  const buildCfg = {
    input: cfg.input,
    plugins: [
      resolve(),
      typescript({
        typescript: require('typescript'),
        tsconfig: path.resolve(__dirname, '../tsconfig.json'),
        cacheRoot: path.resolve(__dirname, `../.cache_${type}`),
      }),
      createReplacePlugin(),
    ]
  }

  const bundle = await rollup.rollup(buildCfg)
  await bundle.generate(cfg.output)
  await bundle.write(cfg.output)
}

console.clear()
// delete old build files
rm(libDir)

const buildVersion = async () => {
  try {
    await build(esm, 'esm')
  } catch (error) {
    console.error('[ERROR]: ', error)
    process.exit(1)
  }
}

let i = 0
const watchFiles = path.resolve(__dirname, '../src')
fs.watch(watchFiles, { recursive: true }, () => {
  console.clear()
  rm(libDir)
  console.log('Rebuild: ' + ++i)
  buildVersion()
})

buildVersion()

if (process.argv.includes('-o')) {
  if (fs.existsSync(devHtml)) {
    opn(devHtml)
  }
}
