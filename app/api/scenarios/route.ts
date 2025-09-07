import { type NextRequest, NextResponse } from "next/server"
import { scenarioEngine } from "@/lib/scenario-engine"

export async function GET() {
  try {
    const scenarios = scenarioEngine.getAllScenarios()
    return NextResponse.json(scenarios)
  } catch (error) {
    console.error("Failed to get scenarios:", error)
    return NextResponse.json({ error: "Failed to retrieve scenarios" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, scenarioId, ...data } = await request.json()

    switch (action) {
      case "create":
        const scenario = scenarioEngine.createScenario(data.name, data.description, data.baselineTrains)
        return NextResponse.json(scenario)

      case "run":
        const results = await scenarioEngine.runScenario(scenarioId)
        return NextResponse.json(results)

      case "delete":
        const deleted = scenarioEngine.deleteScenario(scenarioId)
        return NextResponse.json({ success: deleted })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Scenario API error:", error)
    return NextResponse.json({ error: "Scenario operation failed" }, { status: 500 })
  }
}
