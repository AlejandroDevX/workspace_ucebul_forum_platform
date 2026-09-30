import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// ucebul_mui incluye un import() dinámico de @huggingface/transformers (reconocimiento de voz) que el foro
// no usa; el bundler aún emite su WASM de ONNX (~21 MB). Se descarta solo si ningún chunk lo referencia.
function dropUnreferencedOnnxWasm(): Plugin {
  return {
    name: 'drop-unreferenced-onnx-wasm',
    apply: 'build',
    generateBundle(_options, bundle) {
      const code = Object.values(bundle).map((item) => (item.type === 'chunk' ? item.code : '')).join('\n')
      for (const [fileName, item] of Object.entries(bundle)) {
        if (item.type === 'asset' && /ort-wasm.*\.wasm$/.test(fileName) && !code.includes(fileName)) {
          delete bundle[fileName]
        }
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), dropUnreferencedOnnxWasm()],
})
