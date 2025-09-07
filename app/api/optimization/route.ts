import { type NextRequest, NextResponse } from "next/server"
import { optimizationEngine } from "@/lib/optimization-engine"
import type { Train, TrainSchedule } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { trains, schedules } = await request.json()

    // Validate input data
    if (!trains || !Array.isArray(trains)) {
      return NextResponse.json({ error: "Invalid trains data" }, { status: 400 })
    }

    // Run optimization
    const result = optimizationEngine.optimize(trains as Train[], (schedules as TrainSchedule[]) || [])

    return NextResponse.json(result)
  } catch (error) {
    console.error("Optimization error:", error)
    return NextResponse.json({ error: "Optimization failed" }, { status: 500 })
  }
}

export async function GET() {
  // Return current optimization status
  const sampleTrains: Train[] = [
    { id: 1, trainNumber: "EXP001", trainType: "express", priority: 9, currentStatus: "running", delay: 0 },
    { id: 2, trainNumber: "FRT205", trainType: "freight", priority: 3, currentStatus: "scheduled", delay: 0 },
    { id: 3, trainNumber: "PSG112", trainType: "passenger", priority: 6, currentStatus: "running", delay: 3 },
    { id: 4, trainNumber: "LOC089", trainType: "local", priority: 4, currentStatus: "delayed", delay: 12 },
  ]

  const result = optimizationEngine.optimize(sampleTrains, [])

  return NextResponse.json({
    status: "active",
    lastOptimization: new Date().toISOString(),
    ...result,
  })
}
