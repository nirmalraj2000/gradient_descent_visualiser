import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { Global, css } from '@emotion/react'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider value={defaultSystem}>
      <Global
        styles={css`
          :root {
            color-scheme: light dark;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }
          html, body, #root {
            width: 100%;
            height: 100dvh;
            margin: 0;
            overflow: hidden;
          }
          body {
            margin: 0;
            min-width: 320px;
          }
        `}
      />
      <App />
    </ChakraProvider>
  </StrictMode>,
)
