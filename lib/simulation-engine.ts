export interface TrainPosition {
  trainId: number
  trainNumber: string
  currentTrackId: number
  progress: number // 0-1 along the track
  speed: number // km/h
  status: "moving" | "stopped" | "approaching_station"
  nextStationId: number
  estimatedArrival: Date
}

export interface SimulationState {
  isRunning: boolean
  currentTime: Date
  trainPositions: TrainPosition[]
  conflicts: ConflictEvent[]
  events: SimulationEvent[]
}

export interface ConflictEvent {
  id: string
  type: "collision_risk" | "platform_conflict" | "signal_violation"
  location: string
  trainIds: number[]
  severity: "low" | "medium" | "high" | "critical"
  timestamp: Date
}

export interface SimulationEvent {
  id: string
  type: "departure" | "arrival" | "delay" | "conflict_resolved"
  trainId: number
  location: string
  timestamp: Date
  description: string
}

export class TrainSimulationEngine {
  private state: SimulationState
  private intervalId: NodeJS.Timeout | null = null
  private listeners: ((state: SimulationState) => void)[] = []

  constructor() {
    this.state = {
      isRunning: false,
      currentTime: new Date(),
      trainPositions: this.initializeTrainPositions(),
      conflicts: [],
      events: [],
    }
  }

  private initializeTrainPositions(): TrainPosition[] {
    return [
      {
        trainId: 1,
        trainNumber: "EXP001",
        currentTrackId: 1,
        progress: 0.3,
        speed: 95,
        status: "moving",
        nextStationId: 2,
        estimatedArrival: new Date(Date.now() + 8 * 60000), // 8 minutes
      },
      {
        trainId: 3,
        trainNumber: "PSG112",
        currentTrackId: 2,
        progress: 0.6,
        speed: 75,
        status: "moving",
        nextStationId: 3,
        estimatedArrival: new Date(Date.now() + 12 * 60000), // 12 minutes
      },
      {
        trainId: 4,
        trainNumber: "LOC089",
        currentTrackId: 3,
        progress: 0.1,
        speed: 0,
        status: "stopped",
        nextStationId: 4,
        estimatedArrival: new Date(Date.now() + 25 * 60000), // 25 minutes (delayed)
      },
    ]
  }

  start() {
    if (this.state.isRunning) return

    this.state.isRunning = true
    this.intervalId = setInterval(() => {
      this.updateSimulation()
      this.notifyListeners()
    }, 1000) // Update every second

    this.addEvent({
      id: `event_${Date.now()}`,
      type: "departure",
      trainId: 0,
      location: "System",
      timestamp: new Date(),
      description: "Simulation started",
    })
  }

  stop() {
    if (!this.state.isRunning) return

    this.state.isRunning = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.addEvent({
      id: `event_${Date.now()}`,
      type: "departure",
      trainId: 0,
      location: "System",
      timestamp: new Date(),
      description: "Simulation stopped",
    })
  }

  private updateSimulation() {
    this.state.currentTime = new Date()

    // Update train positions
    this.state.trainPositions = this.state.trainPositions.map((train) => {
      if (train.status === "moving" && train.speed > 0) {
        // Calculate movement based on speed (simplified)
        const speedFactor = train.speed / 100 // Normalize speed
        const progressIncrement = speedFactor * 0.002 // Adjust for realistic movement

        let newProgress = train.progress + progressIncrement

        // Handle track completion
        if (newProgress >= 1.0) {
          newProgress = 0.0
          // Switch to next track (simplified logic)
          const nextTrackId = this.getNextTrackId(train.currentTrackId)

          this.addEvent({
            id: `event_${Date.now()}_${train.trainId}`,
            type: "arrival",
            trainId: train.trainId,
            location: `Station ${train.nextStationId}`,
            timestamp: new Date(),
            description: `${train.trainNumber} arrived at station`,
          })

          return {
            ...train,
            currentTrackId: nextTrackId,
            progress: newProgress,
            status: "approaching_station" as const,
          }
        }

        return { ...train, progress: newProgress }
      }

      return train
    })

    // Detect conflicts
    this.detectRealTimeConflicts()
  }

  private getNextTrackId(currentTrackId: number): number {
    // Simplified routing logic - in production this would use the optimization engine
    const trackRoutes: Record<number, number> = {
      1: 5, // Main Line North -> North-East Link
      2: 1, // Main Line South -> Main Line North
      3: 4, // East Branch -> West Connector
      4: 2, // West Connector -> Main Line South
      5: 3, // North-East Link -> East Branch
    }

    return trackRoutes[currentTrackId] || 1
  }

  private detectRealTimeConflicts() {
    const newConflicts: ConflictEvent[] = []

    // Check for trains on same track
    const trackOccupancy = new Map<number, TrainPosition[]>()

    this.state.trainPositions.forEach((train) => {
      if (!trackOccupancy.has(train.currentTrackId)) {
        trackOccupancy.set(train.currentTrackId, [])
      }
      trackOccupancy.get(train.currentTrackId)?.push(train)
    })

    // Detect collision risks
    trackOccupancy.forEach((trains, trackId) => {
      if (trains.length > 1) {
        // Check if trains are too close
        for (let i = 0; i < trains.length; i++) {
          for (let j = i + 1; j < trains.length; j++) {
            const train1 = trains[i]
            const train2 = trains[j]
            const distance = Math.abs(train1.progress - train2.progress)

            if (distance < 0.1) {
              // Too close (less than 10% of track length)
              const severity = distance < 0.05 ? "critical" : "high"

              newConflicts.push({
                id: `conflict_${Date.now()}_${train1.trainId}_${train2.trainId}`,
                type: "collision_risk",
                location: `Track ${trackId}`,
                trainIds: [train1.trainId, train2.trainId],
                severity,
                timestamp: new Date(),
              })
            }
          }
        }
      }
    })

    // Update conflicts (remove old ones, add new ones)
    this.state.conflicts = [
      ...this.state.conflicts.filter(
        (c) => Date.now() - c.timestamp.getTime() < 30000, // Keep conflicts for 30 seconds
      ),
      ...newConflicts,
    ]
  }

  private addEvent(event: SimulationEvent) {
    this.state.events.unshift(event)
    // Keep only last 50 events
    if (this.state.events.length > 50) {
      this.state.events = this.state.events.slice(0, 50)
    }
  }

  subscribe(listener: (state: SimulationState) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener({ ...this.state }))
  }

  getState(): SimulationState {
    return { ...this.state }
  }

  delayTrain(trainId: number, delayMinutes: number) {
    const train = this.state.trainPositions.find((t) => t.trainId === trainId)
    if (train) {
      train.speed = Math.max(0, train.speed - 20) // Reduce speed
      train.estimatedArrival = new Date(train.estimatedArrival.getTime() + delayMinutes * 60000)

      this.addEvent({
        id: `event_${Date.now()}_${trainId}`,
        type: "delay",
        trainId,
        location: `Track ${train.currentTrackId}`,
        timestamp: new Date(),
        description: `${train.trainNumber} delayed by ${delayMinutes} minutes`,
      })
    }
  }
}

export const simulationEngine = new TrainSimulationEngine()
