"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, AlertTriangle, Train, MapPin } from "lucide-react"
import { simulationEngine, type SimulationState, type TrainPosition } from "@/lib/simulation-engine"

export function TrainSimulationMap() {
  const [simulationState, setSimulationState] = useState<SimulationState>(simulationEngine.getState())

  useEffect(() => {
    const unsubscribe = simulationEngine.subscribe(setSimulationState)
    return unsubscribe
  }, [])

  const toggleSimulation = () => {
    if (simulationState.isRunning) {
      simulationEngine.stop()
    } else {
      simulationEngine.start()
    }
  }

  const getTrainColor = (train: TrainPosition) => {
    switch (train.status) {
      case "moving":
        return "bg-green-500"
      case "stopped":
        return "bg-red-500"
      case "approaching_station":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getConflictSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-600"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Train className="h-5 w-5" />
                Live Train Simulation
              </CardTitle>
              <CardDescription>Real-time visualization of train movements and conflicts</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={simulationState.isRunning ? "default" : "outline"}>
                {simulationState.isRunning ? "Running" : "Stopped"}
              </Badge>
              <Button onClick={toggleSimulation} variant="outline" size="sm">
                {simulationState.isRunning ? (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Start
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative bg-muted rounded-lg p-6 h-96 overflow-hidden">
            {/* Track lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 400">
              {/* Main Line North (Track 1) */}
              <line x1="100" y1="200" x2="300" y2="100" stroke="currentColor" strokeWidth="4" className="text-border" />
              <text x="150" y="140" className="text-xs fill-muted-foreground">
                Main Line North
              </text>

              {/* Main Line South (Track 2) */}
              <line x1="100" y1="200" x2="300" y2="300" stroke="currentColor" strokeWidth="4" className="text-border" />
              <text x="150" y="260" className="text-xs fill-muted-foreground">
                Main Line South
              </text>

              {/* East Branch (Track 3) */}
              <line x1="100" y1="200" x2="500" y2="200" stroke="currentColor" strokeWidth="4" className="text-border" />
              <text x="250" y="190" className="text-xs fill-muted-foreground">
                East Branch
              </text>

              {/* West Connector (Track 4) */}
              <line x1="100" y1="200" x2="50" y2="150" stroke="currentColor" strokeWidth="4" className="text-border" />
              <text x="20" y="170" className="text-xs fill-muted-foreground">
                West Connector
              </text>

              {/* North-East Link (Track 5) */}
              <line x1="300" y1="100" x2="500" y2="200" stroke="currentColor" strokeWidth="4" className="text-border" />
              <text x="350" y="140" className="text-xs fill-muted-foreground">
                North-East Link
              </text>

              {/* Stations */}
              <circle cx="100" cy="200" r="8" className="fill-primary" />
              <text x="110" y="205" className="text-sm fill-foreground font-medium">
                CTR
              </text>

              <circle cx="300" cy="100" r="6" className="fill-secondary" />
              <text x="310" y="105" className="text-sm fill-foreground">
                NTH
              </text>

              <circle cx="300" cy="300" r="6" className="fill-secondary" />
              <text x="310" y="305" className="text-sm fill-foreground">
                STH
              </text>

              <circle cx="500" cy="200" r="6" className="fill-secondary" />
              <text x="510" y="205" className="text-sm fill-foreground">
                EST
              </text>

              <circle cx="50" cy="150" r="6" className="fill-secondary" />
              <text x="10" y="145" className="text-sm fill-foreground">
                WST
              </text>

              {simulationState.trainPositions.map((train) => {
                const position = getTrainPosition(train)
                return (
                  <g key={train.trainId}>
                    <circle
                      cx={position.x}
                      cy={position.y}
                      r="6"
                      className={`${getTrainColor(train)} stroke-2 stroke-background`}
                    />
                    <text x={position.x + 10} y={position.y - 10} className="text-xs fill-foreground font-medium">
                      {train.trainNumber}
                    </text>
                    {train.status === "stopped" && (
                      <circle
                        cx={position.x}
                        cy={position.y}
                        r="10"
                        className="fill-none stroke-red-500 stroke-2 animate-pulse"
                      />
                    )}
                  </g>
                )
              })}

              {simulationState.conflicts.map((conflict) => {
                const position = getConflictPosition(conflict.location)
                return (
                  <g key={conflict.id}>
                    <circle
                      cx={position.x}
                      cy={position.y}
                      r="12"
                      className={`${getConflictSeverityColor(conflict.severity)} animate-pulse opacity-70`}
                    />
                    <AlertTriangle
                      x={position.x - 6}
                      y={position.y - 6}
                      width="12"
                      height="12"
                      className="fill-white"
                    />
                  </g>
                )
              })}
            </svg>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Train className="h-4 w-4" />
                Active Trains ({simulationState.trainPositions.length})
              </h4>
              <div className="space-y-2">
                {simulationState.trainPositions.map((train) => (
                  <div key={train.trainId} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getTrainColor(train)}`} />
                      <span className="font-medium">{train.trainNumber}</span>
                    </div>
                    <div className="text-right">
                      <div>{train.speed} km/h</div>
                      <div className="text-xs text-muted-foreground">
                        Track {train.currentTrackId} • {Math.round(train.progress * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Active Conflicts ({simulationState.conflicts.length})
              </h4>
              <div className="space-y-2">
                {simulationState.conflicts.length > 0 ? (
                  simulationState.conflicts.map((conflict) => (
                    <div key={conflict.id} className="p-2 bg-muted rounded text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className={getConflictSeverityColor(conflict.severity)}>
                          {conflict.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{conflict.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <div className="text-xs">
                        {conflict.type.replace("_", " ")} at {conflict.location}
                      </div>
                      <div className="text-xs text-muted-foreground">Trains: {conflict.trainIds.join(", ")}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">No active conflicts</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Simulation Events</CardTitle>
          <CardDescription>Real-time log of train movements and system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {simulationState.events.length > 0 ? (
              simulationState.events.map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-2 text-sm border-l-2 border-primary/20">
                  <div className="text-xs text-muted-foreground min-w-16">{event.timestamp.toLocaleTimeString()}</div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{event.location}</span>
                  </div>
                  <div className="flex-1">{event.description}</div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No events yet. Start the simulation to see train movements.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getTrainPosition(train: TrainPosition): { x: number; y: number } {
  const trackPositions: Record<number, { start: { x: number; y: number }; end: { x: number; y: number } }> = {
    1: { start: { x: 100, y: 200 }, end: { x: 300, y: 100 } }, // Main Line North
    2: { start: { x: 100, y: 200 }, end: { x: 300, y: 300 } }, // Main Line South
    3: { start: { x: 100, y: 200 }, end: { x: 500, y: 200 } }, // East Branch
    4: { start: { x: 100, y: 200 }, end: { x: 50, y: 150 } }, // West Connector
    5: { start: { x: 300, y: 100 }, end: { x: 500, y: 200 } }, // North-East Link
  }

  const track = trackPositions[train.currentTrackId] || trackPositions[1]
  const x = track.start.x + (track.end.x - track.start.x) * train.progress
  const y = track.start.y + (track.end.y - track.start.y) * train.progress

  return { x, y }
}

function getConflictPosition(location: string): { x: number; y: number } {
  // Extract track number from location string
  const trackMatch = location.match(/Track (\d+)/)
  const trackId = trackMatch ? Number.parseInt(trackMatch[1]) : 1

  // Return midpoint of track
  const trackPositions: Record<number, { x: number; y: number }> = {
    1: { x: 200, y: 150 }, // Main Line North midpoint
    2: { x: 200, y: 250 }, // Main Line South midpoint
    3: { x: 300, y: 200 }, // East Branch midpoint
    4: { x: 75, y: 175 }, // West Connector midpoint
    5: { x: 400, y: 150 }, // North-East Link midpoint
  }

  return trackPositions[trackId] || trackPositions[1]
}
