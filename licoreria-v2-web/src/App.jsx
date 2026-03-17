import AppRouter from './router/AppRouter'
import { Toaster } from '@/components/ui/sonner'
import './App.css'

function App() {
  return (
    <>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </>
  )
}

export default App
