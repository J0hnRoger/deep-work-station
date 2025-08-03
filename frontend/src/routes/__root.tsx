import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import Header from '../components/Header'

export const Route = createRootRoute({
  component: () => (
    <div className="dark min-h-screen bg-background text-foreground">
      <Header className="relative z-30" />
      <main className="flex-1 relative z-20">
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </div>
  ),
})
