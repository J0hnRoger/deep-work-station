import { Outlet, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <div className="dark min-h-screen bg-background text-foreground relative">
      <Outlet />
    </div>
  ),
})
