import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold">CodeSphere</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.name || user?.email}
            </span>
            <Button variant="outline" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="mt-2 text-muted-foreground">
              Welcome to your CodeSphere dashboard
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold">Profile</h3>
              <div className="mt-4 space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Email:</span>{' '}
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Role:</span>{' '}
                  <span className="font-medium capitalize">{user?.role}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tier:</span>{' '}
                  <span className="font-medium capitalize">{user?.tier || 'free'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email Verified:</span>{' '}
                  <span className="font-medium">
                    {user?.emailVerified ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold">Quick Stats</h3>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p>Your coding journey starts here!</p>
                <p className="text-xs">
                  More features coming soon in Phase 2...
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold">Getting Started</h3>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p>Explore coding problems</p>
                <p>Take assessments</p>
                <p>Track your progress</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-6">
            <h3 className="font-semibold">Authentication Status</h3>
            <div className="mt-4 space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                You are successfully authenticated and can access protected routes
              </p>
              <p className="text-muted-foreground">
                This page is protected and only accessible to authenticated users.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
