import { AuthGuard } from "@/components/auth-guard"
import { TrainControlDashboard } from "@/components/train-control-dashboard"

export default function Page() {
  return (
    <AuthGuard>
      <main className="min-h-screen">
        <TrainControlDashboard />
      </main>
    </AuthGuard>
  )
}
