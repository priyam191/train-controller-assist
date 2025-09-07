export interface Train {
  id: number
  trainNumber: string
  trainType: "express" | "freight" | "passenger" | "local"
  priority: number
  capacity?: number
  currentStatus: "scheduled" | "running" | "delayed" | "cancelled" | "completed"
  currentLocation?: string
  delay: number
}

export interface Station {
  id: number
  stationCode: string
  stationName: string
  latitude?: number
  longitude?: number
  platformCount: number
}

export interface Track {
  id: number
  trackName: string
  fromStationId: number
  toStationId: number
  trackType: "single" | "double" | "multiple"
  distanceKm: number
  maxSpeedKmh: number
  isJunction: boolean
}

export interface TrainSchedule {
  id: number
  trainId: number
  stationId: number
  trackId: number
  scheduledArrival?: Date
  scheduledDeparture?: Date
  actualArrival?: Date
  actualDeparture?: Date
  platformNumber?: number
  isStop: boolean
  sequenceOrder: number
}

export interface Conflict {
  id: number
  train1Id: number
  train2Id: number
  conflictType: "crossing" | "platform" | "track_capacity" | "timing"
  conflictLocation: string
  conflictTime: Date
  severity: "low" | "medium" | "high" | "critical"
  status: "active" | "resolved" | "ignored"
  resolutionSuggestion?: string
}

export interface OptimizationResult {
  optimizationId: string
  conflictsResolved: number
  totalDelayReduction: number
  throughputImprovement: number
  suggestions: OptimizationSuggestion[]
  executionTimeMs: number
}

export interface OptimizationSuggestion {
  id: string
  type: "delay" | "reroute" | "platform_change" | "priority_override"
  trainId: number
  description: string
  impact: {
    delayChange: number
    conflictsResolved: number
    throughputGain: number
  }
  confidence: number
}

export interface GraphNode {
  stationId: number
  tracks: GraphEdge[]
}

export interface GraphEdge {
  toStationId: number
  trackId: number
  weight: number
  capacity: number
  currentLoad: number
}
