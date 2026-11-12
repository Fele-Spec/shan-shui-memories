import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'
import { loadDEM } from './lib/dem'

const root = ReactDOM.createRoot(document.getElementById('root')!)

loadDEM()
  .then(() => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  })
  .catch((error) => {
    console.error('[山水拾忆] DEM load failed', error)
    root.render(
      <div className="fallback">
        <div className="fallback__content">
          <p className="fallback__eyebrow">LANDSCAPE MEMORIES</p>
          <h1>山水拾忆</h1>
          <p>真实地形数据加载失败。请检查网络或 assets/dem 文件后刷新。</p>
        </div>
      </div>
    )
  })
