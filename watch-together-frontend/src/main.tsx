import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 👇👇👇 THÊM ĐOẠN NÀY LÊN ĐẦU FILE (QUAN TRỌNG) 👇👇👇
import * as buffer from "buffer";
(window as any).global = window;
(window as any).Buffer = buffer.Buffer;
// 👆👆👆 ------------------------------------------ 👆👆👆

createRoot(document.getElementById('root')!).render(
    <App />
)