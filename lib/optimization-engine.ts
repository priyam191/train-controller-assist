import type {
  Train,
  Station,
  Track,
  TrainSchedule,
  Conflict,
  OptimizationResult,
  OptimizationSuggestion,
  GraphNode,
} from "./types"

export class TrainOptimizationEngine {
  private trains: Train[] = []
  private stations: Station[] = []
  private tracks: Track[] = []
  private schedules: TrainSchedule[] = []
  private conflicts: Conflict[] = []
  private networkGraph: Map<number, GraphNode> = new Map()

  constructor() {
    this.initializeGraph()
  }

  private initializeGraph() {
    // Sample network initialization - in production this would load from database
    const sampleStations = [
      { id: 1, stationCode: "CTR", stationName: "Central Station", platformCount: 6 },
      { id: 2, stationCode: "NTH", stationName: "North Junction", platformCount: 4 },
      { id: 3, stationCode: "STH", stationName: "South Terminal", platformCount: 3 },
      { id: 4, stationCode: "EST", stationName: "East Station", platformCount: 2 },
      { id: 5, stationCode: "WST", stationName: "West Hub", platformCount: 5 },
    ]

    const sampleTracks = [
      {
        id: 1,
        trackName: "Main Line North",
        fromStationId: 1,
        toStationId: 2,
        trackType: "double" as const,
        distanceKm: 15.5,
        maxSpeedKmh: 120,
        isJunction: false,
      },
      {
        id: 2,
        trackName: "Main Line South",
        fromStationId: 1,
        toStationId: 3,
        trackType: "single" as const,
        distanceKm: 12.3,
        maxSpeedKmh: 100,
        isJunction: false,
      },
      {
        id: 3,
        trackName: "East Branch",
        fromStationId: 1,
        toStationId: 4,
        trackType: "single" as const,
        distanceKm: 8.7,
        maxSpeedKmh: 80,
        isJunction: false,
      },
      {
        id: 4,
        trackName: "West Connector",
        fromStationId: 1,
        toStationId: 5,
        trackType: "double" as const,
        distanceKm: 11.2,
        maxSpeedKmh: 110,
        isJunction: true,
      },
      {
        id: 5,
        trackName: "North-East Link",
        fromStationId: 2,
        toStationId: 4,
        trackType: "single" as const,
        distanceKm: 18.9,
        maxSpeedKmh: 90,
        isJunction: true,
      },
    ]

    this.stations = sampleStations
    this.tracks = sampleTracks

    // Build graph representation
    sampleStations.forEach((station) => {
      this.networkGraph.set(station.id, { stationId: station.id, tracks: [] })
    })

    sampleTracks.forEach((track) => {
      const capacity = track.trackType === "double" ? 4 : track.trackType === "multiple" ? 6 : 2
      const weight = track.distanceKm / track.maxSpeedKmh // Travel time in hours

      // Add bidirectional edges
      this.networkGraph.get(track.fromStationId)?.tracks.push({
        toStationId: track.toStationId,
        trackId: track.id,
        weight,
        capacity,
        currentLoad: 0,
      })

      this.networkGraph.get(track.toStationId)?.tracks.push({
        toStationId: track.fromStationId,
        trackId: track.id,
        weight,
        capacity,
        currentLoad: 0,
      })
    })
  }

  findOptimalRoute(
    fromStationId: number,
    toStationId: number,
    trainPriority: number,
  ): { path: number[]; totalTime: number; tracks: number[] } {
    const distances = new Map<number, number>()
    const previous = new Map<number, number>()
    const trackUsed = new Map<number, number>()
    const unvisited = new Set<number>()

    // Initialize distances
    this.networkGraph.forEach((_, stationId) => {
      distances.set(stationId, stationId === fromStationId ? 0 : Number.POSITIVE_INFINITY)
      unvisited.add(stationId)
    })

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let currentStation = -1
      let minDistance = Number.POSITIVE_INFINITY

      for (const stationId of unvisited) {
        const distance = distances.get(stationId) || Number.POSITIVE_INFINITY
        if (distance < minDistance) {
          minDistance = distance
          currentStation = stationId
        }
      }

      if (currentStation === -1 || minDistance === Number.POSITIVE_INFINITY) break

      unvisited.delete(currentStation)

      if (currentStation === toStationId) break

      const currentNode = this.networkGraph.get(currentStation)
      if (!currentNode) continue

      // Check all neighbors
      for (const edge of currentNode.tracks) {
        if (!unvisited.has(edge.toStationId)) continue

        // Apply capacity and priority constraints
        const capacityPenalty = edge.currentLoad >= edge.capacity ? 10 : 0
        const priorityBonus = trainPriority > 7 ? -0.1 : 0

        const altDistance = minDistance + edge.weight + capacityPenalty + priorityBonus

        if (altDistance < (distances.get(edge.toStationId) || Number.POSITIVE_INFINITY)) {
          distances.set(edge.toStationId, altDistance)
          previous.set(edge.toStationId, currentStation)
          trackUsed.set(edge.toStationId, edge.trackId)
        }
      }
    }

    // Reconstruct path
    const path: number[] = []
    const tracks: number[] = []
    let current = toStationId

    while (previous.has(current)) {
      path.unshift(current)
      tracks.unshift(trackUsed.get(current) || 0)
      current = previous.get(current) || 0
    }

    if (current === fromStationId) {
      path.unshift(fromStationId)
    }

    return {
      path,
      totalTime: distances.get(toStationId) || Number.POSITIVE_INFINITY,
      tracks,
    }
  }

  detectConflicts(trains: Train[], schedules: TrainSchedule[]): Conflict[] {
    const conflicts: Conflict[] = []
    const now = new Date()

    // Platform conflicts
    const platformOccupancy = new Map<string, { trainId: number; start: Date; end: Date }[]>()

    schedules.forEach((schedule) => {
      if (!schedule.scheduledArrival || !schedule.scheduledDeparture) return

      const key = `${schedule.stationId}-${schedule.platformNumber}`
      if (!platformOccupancy.has(key)) {
        platformOccupancy.set(key, [])
      }

      platformOccupancy.get(key)?.push({
        trainId: schedule.trainId,
        start: schedule.scheduledArrival,
        end: schedule.scheduledDeparture,
      })
    })

    // Check for overlapping platform usage
    platformOccupancy.forEach((occupancies, platformKey) => {
      for (let i = 0; i < occupancies.length; i++) {
        for (let j = i + 1; j < occupancies.length; j++) {
          const occ1 = occupancies[i]
          const occ2 = occupancies[j]

          if (this.timeOverlap(occ1.start, occ1.end, occ2.start, occ2.end)) {
            const train1 = trains.find((t) => t.id === occ1.trainId)
            const train2 = trains.find((t) => t.id === occ2.trainId)

            if (train1 && train2) {
              conflicts.push({
                id: conflicts.length + 1,
                train1Id: occ1.trainId,
                train2Id: occ2.trainId,
                conflictType: "platform",
                conflictLocation: platformKey,
                conflictTime: occ1.start < occ2.start ? occ1.start : occ2.start,
                severity: this.calculateSeverity(train1, train2),
                status: "active",
                resolutionSuggestion: this.generateResolutionSuggestion(train1, train2, "platform"),
              })
            }
          }
        }
      }
    })

    return conflicts
  }

  private timeOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && start2 < end1
  }

  private calculateSeverity(train1: Train, train2: Train): "low" | "medium" | "high" | "critical" {
    const maxPriority = Math.max(train1.priority, train2.priority)
    const totalDelay = train1.delay + train2.delay

    if (maxPriority >= 9 || totalDelay > 15) return "critical"
    if (maxPriority >= 7 || totalDelay > 10) return "high"
    if (maxPriority >= 5 || totalDelay > 5) return "medium"
    return "low"
  }

  private generateResolutionSuggestion(train1: Train, train2: Train, conflictType: string): string {
    const lowerPriorityTrain = train1.priority < train2.priority ? train1 : train2
    const higherPriorityTrain = train1.priority >= train2.priority ? train1 : train2

    switch (conflictType) {
      case "platform":
        return `Delay ${lowerPriorityTrain.trainNumber} by 5-10 minutes or reassign to alternative platform`
      case "track_capacity":
        return `Hold ${lowerPriorityTrain.trainNumber} at previous station until ${higherPriorityTrain.trainNumber} clears the section`
      case "crossing":
        return `Give precedence to ${higherPriorityTrain.trainNumber} at junction`
      default:
        return `Prioritize ${higherPriorityTrain.trainNumber} over ${lowerPriorityTrain.trainNumber}`
    }
  }

  optimize(trains: Train[], schedules: TrainSchedule[]): OptimizationResult {
    const startTime = Date.now()
    const optimizationId = `opt_${Date.now()}`

    // Detect conflicts
    const conflicts = this.detectConflicts(trains, schedules)

    // Generate optimization suggestions
    const suggestions: OptimizationSuggestion[] = []
    let totalDelayReduction = 0
    let conflictsResolved = 0

    // Rule 1: Priority-based scheduling
    const sortedTrains = [...trains].sort((a, b) => b.priority - a.priority)

    conflicts.forEach((conflict, index) => {
      const train1 = trains.find((t) => t.id === conflict.train1Id)
      const train2 = trains.find((t) => t.id === conflict.train2Id)

      if (!train1 || !train2) return

      const lowerPriorityTrain = train1.priority < train2.priority ? train1 : train2
      const delayAmount = this.calculateOptimalDelay(conflict)

      suggestions.push({
        id: `sug_${index + 1}`,
        type: "delay",
        trainId: lowerPriorityTrain.id,
        description: `Delay ${lowerPriorityTrain.trainNumber} by ${delayAmount} minutes to resolve ${conflict.conflictType} conflict`,
        impact: {
          delayChange: delayAmount,
          conflictsResolved: 1,
          throughputGain: this.calculateThroughputGain(conflict),
        },
        confidence: this.calculateConfidence(conflict, lowerPriorityTrain),
      })

      totalDelayReduction += Math.max(0, lowerPriorityTrain.delay - delayAmount)
      conflictsResolved++
    })

    // Rule 2: Route optimization for freight trains
    trains
      .filter((t) => t.trainType === "freight")
      .forEach((train) => {
        const alternativeRoute = this.findOptimalRoute(1, 3, train.priority) // Example route
        if (alternativeRoute.totalTime < 0.5) {
          // If route is efficient
          suggestions.push({
            id: `route_${train.id}`,
            type: "reroute",
            trainId: train.id,
            description: `Reroute ${train.trainNumber} via alternative path to reduce congestion`,
            impact: {
              delayChange: -5,
              conflictsResolved: 0,
              throughputGain: 8,
            },
            confidence: 0.85,
          })
        }
      })

    const executionTime = Date.now() - startTime

    return {
      optimizationId,
      conflictsResolved,
      totalDelayReduction,
      throughputImprovement: suggestions.reduce((sum, s) => sum + s.impact.throughputGain, 0),
      suggestions,
      executionTimeMs: executionTime,
    }
  }

  private calculateOptimalDelay(conflict: Conflict): number {
    switch (conflict.severity) {
      case "critical":
        return 15
      case "high":
        return 10
      case "medium":
        return 5
      case "low":
        return 3
      default:
        return 5
    }
  }

  private calculateThroughputGain(conflict: Conflict): number {
    const baseGain = conflict.conflictType === "track_capacity" ? 12 : conflict.conflictType === "platform" ? 8 : 5

    const severityMultiplier = conflict.severity === "critical" ? 2 : conflict.severity === "high" ? 1.5 : 1

    return Math.round(baseGain * severityMultiplier)
  }

  private calculateConfidence(conflict: Conflict, train: Train): number {
    let confidence = 0.7 // Base confidence

    // Higher confidence for higher severity conflicts
    if (conflict.severity === "critical") confidence += 0.2
    else if (conflict.severity === "high") confidence += 0.1

    // Lower confidence for high priority trains (more complex to reschedule)
    if (train.priority >= 8) confidence -= 0.1
    else if (train.priority <= 3) confidence += 0.1

    return Math.min(0.95, Math.max(0.5, confidence))
  }
}

export const optimizationEngine = new TrainOptimizationEngine()
