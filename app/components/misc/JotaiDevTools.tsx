// components/JotaiDevTools.tsx
import { lazy, Suspense } from 'react'

const DevToolsLazy = lazy(() =>
  import('jotai-devtools').then((mod) => ({ default: mod.DevTools }))
)

export const JotaiDevTools = () => {
  if (process.env.NODE_ENV === 'production') return null
  return (
    <Suspense fallback={null}>
      <DevToolsLazy />
    </Suspense>
  )
}
