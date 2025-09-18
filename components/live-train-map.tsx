"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Train, MapPin, Play, Pause, RotateCcw, Zap } from "lucide-react"

interface TrainPosition {
  id: string
  name: string
  x: number
  y: number
  speed: number
  direction: number
  status: "running" | "stopped" | "delayed"
  route: string
  nextStation: string
  passengers: number
}

interface Station {
  id: string
  name: string
  x: number
  y: number
  type: "major" | "minor"
}

interface Track {
  id: string
  points: { x: number; y: number }[]
  type: "main" | "branch"
}

export function LiveTrainMap() {
  const [trains, setTrains] = useState<TrainPosition[]>([])
  const [isRunning, setIsRunning] = useState(true)
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout>()

  // Static stations and tracks
  const stations: Station[] = [
    { id: "central", name: "Central Station", x: 50, y: 50, type: "major" },
    { id: "north", name: "North Terminal", x: 50, y: 20, type: "major" },
    { id: "south", name: "South Junction", x: 50, y: 80, type: "major" },
    { id: "east", name: "East Plaza", x: 80, y: 50, type: "minor" },
    { id: "west", name: "West Park", x: 20, y: 50, type: "minor" },
    { id: "northeast", name: "Northeast Hub", x: 75, y: 25, type: "minor" },
    { id: "southwest", name: "Southwest Mall", x: 25, y: 75, type: "minor" },
  ]

  const tracks: Track[] = [
    {
      id: "main-ns",
      points: [
        { x: 50, y: 20 },
        { x: 50, y: 80 },
      ],
      type: "main",
    },
    {
      id: "main-ew",
      points: [
        { x: 20, y: 50 },
        { x: 80, y: 50 },
      ],
      type: "main",
    },
    {
      id: "branch-ne",
      points: [
        { x: 50, y: 50 },
        { x: 75, y: 25 },
      ],
      type: "branch",
    },
    {
      id: "branch-sw",
      points: [
        { x: 50, y: 50 },
        { x: 25, y: 75 },
      ],
      type: "branch",
    },
  ]

  // Initialize trains
  useEffect(() => {
    const initialTrains: TrainPosition[] = [
      {
        id: "T001",
        name: "Express North",
        x: 50,
        y: 60,
        speed: 2,
        direction: 0, // North
        status: "running",
        route: "North Line",
        nextStation: "North Terminal",
        passengers: 245,
      },
      {
        id: "T002",
        name: "City Circle",
        x: 40,
        y: 50,
        speed: 1.5,
        direction: 90, // East
        status: "running",
        route: "Circle Line",
        nextStation: "Central Station",
        passengers: 180,
      },
      {
        id: "T003",
        name: "South Express",
        x: 50,
        y: 30,
        speed: 2.2,
        direction: 180, // South
        status: "running",
        route: "South Line",
        nextStation: "South Junction",
        passengers: 320,
      },
      {
        id: "T004",
        name: "East Local",
        x: 60,
        y: 50,
        speed: 1.8,
        direction: 270, // West
        status: "delayed",
        route: "East Branch",
        nextStation: "Central Station",
        passengers: 95,
      },
      {
        id: "T005",
        name: "West Shuttle",
        x: 30,
        y: 50,
        speed: 1.2,
        direction: 90, // East
        status: "stopped",
        route: "West Branch",
        nextStation: "West Park",
        passengers: 67,
      },
    ]
    setTrains(initialTrains)
  }, [])

  // Animation loop
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTrains((prevTrains) =>
          prevTrains.map((train) => {
            if (train.status === "stopped") return train

            let newX = train.x
            let newY = train.y
            let newDirection = train.direction

            // Move train based on direction
            const moveDistance = train.speed * 0.5
            switch (train.direction) {
              case 0: // North
                newY = Math.max(15, train.y - moveDistance)
                if (newY <= 15) newDirection = 180
                break
              case 90: // East
                newX = Math.min(85, train.x + moveDistance)
                if (newX >= 85) newDirection = 270
                break
              case 180: // South
                newY = Math.min(85, train.y + moveDistance)
                if (newY >= 85) newDirection = 0
                break
              case 270: // West
                newX = Math.max(15, train.x - moveDistance)
                if (newX <= 15) newDirection = 90
                break
            }

            // Update next station based on position
            let nextStation = train.nextStation
            const nearestStation = stations.reduce((nearest, station) => {
              const distance = Math.sqrt(Math.pow(newX - station.x, 2) + Math.pow(newY - station.y, 2))
              const nearestDistance = Math.sqrt(Math.pow(newX - nearest.x, 2) + Math.pow(newY - nearest.y, 2))
              return distance < nearestDistance ? station : nearest
            })

            if (Math.sqrt(Math.pow(newX - nearestStation.x, 2) + Math.pow(newY - nearestStation.y, 2)) < 8) {
              nextStation = nearestStation.name
            }

            return {
              ...train,
              x: newX,
              y: newY,
              direction: newDirection,
              nextStation,
            }
          }),
        )
      }, 100)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  const toggleSimulation = () => {
    setIsRunning(!isRunning)
  }

  const resetSimulation = () => {
    setIsRunning(false)
    // Reset to initial positions
    setTrains((prevTrains) =>
      prevTrains.map((train, index) => ({
        ...train,
        x: [50, 40, 50, 60, 30][index],
        y: [60, 50, 30, 50, 50][index],
        direction: [0, 90, 180, 270, 90][index],
        status: index === 3 ? "delayed" : index === 4 ? "stopped" : "running",
      })),
    )
  }

  const getTrainColor = (status: string) => {
    switch (status) {
      case "running":
        return "text-green-500"
      case "delayed":
        return "text-yellow-500"
      case "stopped":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "running":
        return "default"
      case "delayed":
        return "secondary"
      case "stopped":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Train Map
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSimulation}
              className="flex items-center gap-2 bg-transparent"
            >
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isRunning ? "Pause" : "Start"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetSimulation}
              className="flex items-center gap-2 bg-transparent"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Map Container */}
          <div className="relative bg-slate-100 dark:bg-slate-800 rounded-lg p-4 h-96 overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%" className="absolute inset-0">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Tracks */}
            <svg className="absolute inset-0 w-full h-full">
              {tracks.map((track) => (
                <g key={track.id}>
                  {track.points.length > 1 && (
                    <line
                      x1={`${track.points[0].x}%`}
                      y1={`${track.points[0].y}%`}
                      x2={`${track.points[1].x}%`}
                      y2={`${track.points[1].y}%`}
                      stroke={track.type === "main" ? "#374151" : "#6b7280"}
                      strokeWidth={track.type === "main" ? "3" : "2"}
                      className="dark:stroke-gray-400"
                    />
                  )}
                </g>
              ))}
            </svg>

            {/* Stations */}
            {stations.map((station) => (
              <div
                key={station.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${station.x}%`, top: `${station.y}%` }}
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    station.type === "major" ? "bg-blue-600" : "bg-gray-400"
                  } border-2 border-white shadow-sm`}
                />
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xs font-medium text-foreground whitespace-nowrap">
                  {station.name}
                </div>
              </div>
            ))}

            {/* Trains */}
            {trains.map((train) => (
              <div
                key={train.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-100"
                style={{
                  left: `${train.x}%`,
                  top: `${train.y}%`,
                  transform: `translate(-50%, -50%) rotate(${train.direction}deg)`,
                }}
                onClick={() => setSelectedTrain(selectedTrain === train.id ? null : train.id)}
              >
                <div className={`relative ${getTrainColor(train.status)}`}>
                  <Train className="h-6 w-6 drop-shadow-sm" />
                  {train.status === "running" && (
                    <Zap className="absolute -top-1 -right-1 h-3 w-3 text-green-400 animate-pulse" />
                  )}
                </div>

                {/* Train Info Popup */}
                {selectedTrain === train.id && (
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-popover border border-border rounded-lg p-3 shadow-lg z-10 min-w-48">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">{train.name}</h4>
                        <Badge variant={getStatusBadgeVariant(train.status)} className="text-xs">
                          {train.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Route: {train.route}</div>
                        <div>Next: {train.nextStation}</div>
                        <div>Speed: {train.speed.toFixed(1)} km/h</div>
                        <div>Passengers: {train.passengers}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Train Status List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {trains.map((train) => (
              <div
                key={train.id}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  selectedTrain === train.id ? "bg-accent border-accent-foreground" : "bg-card hover:bg-accent/50"
                }`}
                onClick={() => setSelectedTrain(selectedTrain === train.id ? null : train.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Train className={`h-4 w-4 ${getTrainColor(train.status)}`} />
                    <span className="font-medium text-sm">{train.name}</span>
                  </div>
                  <Badge variant={getStatusBadgeVariant(train.status)} className="text-xs">
                    {train.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Next: {train.nextStation}</div>
                  <div>{train.passengers} passengers</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
