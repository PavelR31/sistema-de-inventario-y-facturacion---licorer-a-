import AppRouter from './router/AppRouter'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import './App.css'

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="licora-theme">
      <AppRouter />
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  )
}

export default App
