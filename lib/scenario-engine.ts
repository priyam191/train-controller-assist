import type { Train, OptimizationResult } from "./types"
import { optimizationEngine } from "./optimization-engine"

export interface Scenario {
  id: string
  name: string
  description: string
  baselineTrains: Train[]
  modifications: ScenarioModification[]
  results?: ScenarioResults
  createdAt: Date
}

export interface ScenarioModification {
  id: string
  type: "delay_train" | "block_track" | "change_priority" | "add_train" | "cancel_train"
  targetId: number // train ID or track ID
  parameters: Record<string, any>
  description: string
}

export interface ScenarioResults {
  optimizationResult: OptimizationResult
  impactMetrics: {
    totalDelayChange: number
    conflictsChange: number
    throughputChange: number
    affectedTrains: number
  }
  comparisonWithBaseline: {
    delayImprovement: number
    conflictReduction: number
    throughputGain: number
  }
}

export class ScenarioEngine {
  private scenarios: Map<string, Scenario> = new Map()
  private baselineResults: OptimizationResult | null = null

  createScenario(name: string, description: string, baselineTrains: Train[]): Scenario {
    const scenario: Scenario = {
      id: `scenario_${Date.now()}`,
      name,
      description,
      baselineTrains: [...baselineTrains],
      modifications: [],
      createdAt: new Date(),
    }

    this.scenarios.set(scenario.id, scenario)
    return scenario
  }

  addModification(scenarioId: string, modification: Omit<ScenarioModification, "id">): boolean {
    const scenario = this.scenarios.get(scenarioId)
    if (!scenario) return false

    const newModification: ScenarioModification = {
      ...modification,
      id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    scenario.modifications.push(newModification)
    return true
  }

  removeModification(scenarioId: string, modificationId: string): boolean {
    const scenario = this.scenarios.get(scenarioId)
    if (!scenario) return false

    scenario.modifications = scenario.modifications.filter((m) => m.id !== modificationId)
    return true
  }

  async runScenario(scenarioId: string): Promise<ScenarioResults | null> {
    const scenario = this.scenarios.get(scenarioId)
    if (!scenario) return null

    // Apply modifications to create modified train data
    const modifiedTrains = this.applyModifications(scenario.baselineTrains, scenario.modifications)

    // Run optimization on modified data
    const optimizationResult = optimizationEngine.optimize(modifiedTrains, [])

    // Calculate baseline if not exists
    if (!this.baselineResults) {
      this.baselineResults = optimizationEngine.optimize(scenario.baselineTrains, [])
    }

    const impactMetrics = this.calculateImpactMetrics(modifiedTrains, scenario.baselineTrains)
    const comparisonWithBaseline = this.compareWithBaseline(optimizationResult, this.baselineResults)

    const results: ScenarioResults = {
      optimizationResult,
      impactMetrics,
      comparisonWithBaseline,
    }

    // Store results in scenario
    scenario.results = results
    return results
  }

  private applyModifications(baselineTrains: Train[], modifications: ScenarioModification[]): Train[] {
    let modifiedTrains = [...baselineTrains]

    modifications.forEach((mod) => {
      switch (mod.type) {
        case "delay_train":
          const trainToDelay = modifiedTrains.find((t) => t.id === mod.targetId)
          if (trainToDelay) {
            trainToDelay.delay += mod.parameters.delayMinutes || 0
            trainToDelay.currentStatus = "delayed"
          }
          break

        case "change_priority":
          const trainToPrioritize = modifiedTrains.find((t) => t.id === mod.targetId)
          if (trainToPrioritize) {
            trainToPrioritize.priority = mod.parameters.newPriority || trainToPrioritize.priority
          }
          break

        case "cancel_train":
          modifiedTrains = modifiedTrains.filter((t) => t.id !== mod.targetId)
          break

        case "add_train":
          const newTrain: Train = {
            id: mod.targetId,
            trainNumber: mod.parameters.trainNumber || `NEW${mod.targetId}`,
            trainType: mod.parameters.trainType || "passenger",
            priority: mod.parameters.priority || 5,
            currentStatus: "scheduled",
            delay: 0,
          }
          modifiedTrains.push(newTrain)
          break

        case "block_track":
          // For track blocking, we would modify affected trains
          // This is a simplified implementation
          modifiedTrains.forEach((train) => {
            if (mod.parameters.affectedTrainIds?.includes(train.id)) {
              train.delay += mod.parameters.additionalDelay || 15
              train.currentStatus = "delayed"
            }
          })
          break
      }
    })

    return modifiedTrains
  }

  private calculateImpactMetrics(modifiedTrains: Train[], baselineTrains: Train[]): ScenarioResults["impactMetrics"] {
    const baselineDelay = baselineTrains.reduce((sum, t) => sum + t.delay, 0)
    const modifiedDelay = modifiedTrains.reduce((sum, t) => sum + t.delay, 0)

    const baselineConflicts = baselineTrains.filter((t) => t.currentStatus === "delayed").length
    const modifiedConflicts = modifiedTrains.filter((t) => t.currentStatus === "delayed").length

    const affectedTrains = modifiedTrains.filter((train) => {
      const baseline = baselineTrains.find((b) => b.id === train.id)
      return !baseline || baseline.delay !== train.delay || baseline.currentStatus !== train.currentStatus
    }).length

    return {
      totalDelayChange: modifiedDelay - baselineDelay,
      conflictsChange: modifiedConflicts - baselineConflicts,
      throughputChange: modifiedTrains.length - baselineTrains.length,
      affectedTrains,
    }
  }

  private compareWithBaseline(
    scenarioResult: OptimizationResult,
    baselineResult: OptimizationResult,
  ): ScenarioResults["comparisonWithBaseline"] {
    return {
      delayImprovement: baselineResult.totalDelayReduction - scenarioResult.totalDelayReduction,
      conflictReduction: scenarioResult.conflictsResolved - baselineResult.conflictsResolved,
      throughputGain: scenarioResult.throughputImprovement - baselineResult.throughputImprovement,
    }
  }

  getAllScenarios(): Scenario[] {
    return Array.from(this.scenarios.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  getScenario(scenarioId: string): Scenario | null {
    return this.scenarios.get(scenarioId) || null
  }

  deleteScenario(scenarioId: string): boolean {
    return this.scenarios.delete(scenarioId)
  }

  getScenarioTemplates(): Array<{
    name: string
    description: string
    modifications: Omit<ScenarioModification, "id">[]
  }> {
    return [
      {
        name: "Express Train Delay",
        description: "Test impact of a 15-minute delay on the highest priority express train",
        modifications: [
          {
            type: "delay_train",
            targetId: 1,
            parameters: { delayMinutes: 15 },
            description: "Delay EXP001 by 15 minutes",
          },
        ],
      },
      {
        name: "Track Maintenance Block",
        description: "Simulate blocking Main Line North for 30 minutes",
        modifications: [
          {
            type: "block_track",
            targetId: 1,
            parameters: {
              duration: 30,
              affectedTrainIds: [1, 3],
              additionalDelay: 20,
            },
            description: "Block Main Line North, affecting EXP001 and PSG112",
          },
        ],
      },
      {
        name: "Emergency Priority Override",
        description: "Boost local train priority to maximum for emergency transport",
        modifications: [
          {
            type: "change_priority",
            targetId: 4,
            parameters: { newPriority: 10 },
            description: "Increase LOC089 priority to maximum (10)",
          },
        ],
      },
      {
        name: "Additional Express Service",
        description: "Add an extra express train during peak hours",
        modifications: [
          {
            type: "add_train",
            targetId: 5,
            parameters: {
              trainNumber: "EXP003",
              trainType: "express",
              priority: 8,
            },
            description: "Add EXP003 express service",
          },
        ],
      },
    ]
  }
}

export const scenarioEngine = new ScenarioEngine()
