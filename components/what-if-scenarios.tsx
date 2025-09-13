"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Play, Plus, Trash2, Clock, AlertTriangle, TrendingUp, Train, Settings, BarChart3, Zap } from "lucide-react"
import { scenarioEngine, type Scenario, type ScenarioModification, type ScenarioResults } from "@/lib/scenario-engine"

const sampleTrains = [
  { id: 1, trainNumber: "EXP001", trainType: "express", priority: 9, currentStatus: "running", delay: 0 },
  { id: 2, trainNumber: "FRT205", trainType: "freight", priority: 3, currentStatus: "scheduled", delay: 0 },
  { id: 3, trainNumber: "PSG112", trainType: "passenger", priority: 6, currentStatus: "running", delay: 3 },
  { id: 4, trainNumber: "LOC089", trainType: "local", priority: 4, currentStatus: "delayed", delay: 12 },
]

export function WhatIfScenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [isCreatingScenario, setIsCreatingScenario] = useState(false)
  const [isRunningScenario, setIsRunningScenario] = useState(false)
  const [newScenarioName, setNewScenarioName] = useState("")
  const [newScenarioDescription, setNewScenarioDescription] = useState("")

  useEffect(() => {
    loadScenarios()
  }, [])

  const loadScenarios = () => {
    setScenarios(scenarioEngine.getAllScenarios())
  }

  const createScenario = () => {
    if (!newScenarioName.trim()) return

    const scenario = scenarioEngine.createScenario(newScenarioName, newScenarioDescription, sampleTrains)

    setScenarios([scenario, ...scenarios])
    setSelectedScenario(scenario)
    setNewScenarioName("")
    setNewScenarioDescription("")
    setIsCreatingScenario(false)
  }

  const createFromTemplate = (template: any) => {
    const scenario = scenarioEngine.createScenario(template.name, template.description, sampleTrains)

    template.modifications.forEach((mod: any) => {
      scenarioEngine.addModification(scenario.id, mod)
    })

    setScenarios([scenario, ...scenarios])
    setSelectedScenario(scenario)
  }

  const runScenario = async (scenarioId: string) => {
    setIsRunningScenario(true)
    try {
      const results = await scenarioEngine.runScenario(scenarioId)
      if (results) {
        loadScenarios() // Refresh to get updated results
        const updatedScenario = scenarioEngine.getScenario(scenarioId)
        setSelectedScenario(updatedScenario)
      }
    } catch (error) {
      console.error("Failed to run scenario:", error)
    } finally {
      setIsRunningScenario(false)
    }
  }

  const addModification = (scenarioId: string, modification: Omit<ScenarioModification, "id">) => {
    scenarioEngine.addModification(scenarioId, modification)
    loadScenarios()
    const updatedScenario = scenarioEngine.getScenario(scenarioId)
    setSelectedScenario(updatedScenario)
  }

  const removeModification = (scenarioId: string, modificationId: string) => {
    scenarioEngine.removeModification(scenarioId, modificationId)
    loadScenarios()
    const updatedScenario = scenarioEngine.getScenario(scenarioId)
    setSelectedScenario(updatedScenario)
  }

  const deleteScenario = (scenarioId: string) => {
    scenarioEngine.deleteScenario(scenarioId)
    loadScenarios()
    if (selectedScenario?.id === scenarioId) {
      setSelectedScenario(null)
    }
  }

  const getModificationIcon = (type: string) => {
    switch (type) {
      case "delay_train":
        return <Clock className="h-4 w-4" />
      case "block_track":
        return <AlertTriangle className="h-4 w-4" />
      case "change_priority":
        return <TrendingUp className="h-4 w-4" />
      case "add_train":
        return <Plus className="h-4 w-4" />
      case "cancel_train":
        return <Trash2 className="h-4 w-4" />
      default:
        return <Settings className="h-4 w-4" />
    }
  }

  const getImpactColor = (value: number) => {
    if (value > 0) return "text-red-500"
    if (value < 0) return "text-green-500"
    return "text-muted-foreground"
  }

  const templates = scenarioEngine.getScenarioTemplates()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">What-If Scenarios</h2>
          <p className="text-muted-foreground">Test different strategies and see their impact before implementation</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreatingScenario} onOpenChange={setIsCreatingScenario}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Scenario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Scenario</DialogTitle>
                <DialogDescription>Create a custom scenario to test different operational strategies</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="scenario-name">Scenario Name</Label>
                  <Input
                    id="scenario-name"
                    value={newScenarioName}
                    onChange={(e) => setNewScenarioName(e.target.value)}
                    placeholder="e.g., Peak Hour Disruption"
                  />
                </div>
                <div>
                  <Label htmlFor="scenario-description">Description</Label>
                  <Textarea
                    id="scenario-description"
                    value={newScenarioDescription}
                    onChange={(e) => setNewScenarioDescription(e.target.value)}
                    placeholder="Describe what this scenario tests..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreatingScenario(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createScenario} disabled={!newScenarioName.trim()}>
                    Create Scenario
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Templates</CardTitle>
              <CardDescription>Pre-configured scenarios for common situations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {templates.map((template, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => createFromTemplate(template)}
                >
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Scenarios ({scenarios.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {scenarios.length > 0 ? (
                scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedScenario?.id === scenario.id ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedScenario(scenario)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{scenario.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">{scenario.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {scenario.modifications.length} modifications
                          </Badge>
                          {scenario.results && (
                            <Badge variant="secondary" className="text-xs">
                              Results available
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteScenario(scenario.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No scenarios created yet. Use templates or create a new scenario.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedScenario ? (
            <Tabs defaultValue="modifications" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="modifications">Modifications</TabsTrigger>
                  <TabsTrigger value="results">Results</TabsTrigger>
                </TabsList>
                <Button
                  onClick={() => runScenario(selectedScenario.id)}
                  disabled={isRunningScenario}
                  className="flex items-center gap-2"
                >
                  {isRunningScenario ? <Zap className="h-4 w-4 animate-pulse" /> : <Play className="h-4 w-4" />}
                  {isRunningScenario ? "Running..." : "Run Scenario"}
                </Button>
              </div>

              <TabsContent value="modifications" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedScenario.name}</CardTitle>
                    <CardDescription>{selectedScenario.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">
                          Current Modifications ({selectedScenario.modifications.length})
                        </h4>
                        {selectedScenario.modifications.length > 0 ? (
                          <div className="space-y-2">
                            {selectedScenario.modifications.map((mod) => (
                              <div key={mod.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-3">
                                  {getModificationIcon(mod.type)}
                                  <div>
                                    <p className="text-sm font-medium">{mod.description}</p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                      {mod.type.replace("_", " ")}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeModification(selectedScenario.id, mod.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No modifications added yet.</p>
                        )}
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Add Modification</h4>
                        <ModificationBuilder
                          onAdd={(mod) => addModification(selectedScenario.id, mod)}
                          trains={sampleTrains}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="results" className="space-y-4">
                {selectedScenario.results ? (
                  <ScenarioResultsDisplay results={selectedScenario.results} />
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No results available</p>
                      <p className="text-sm text-muted-foreground">
                        Run the scenario to see impact analysis and optimization results
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Train className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No scenario selected</p>
                <p className="text-sm text-muted-foreground">
                  Select a scenario from the list or create a new one to start testing what-if situations
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function ModificationBuilder({
  onAdd,
  trains,
}: { onAdd: (mod: Omit<ScenarioModification, "id">) => void; trains: any[] }) {
  const [modType, setModType] = useState<string>("")
  const [targetId, setTargetId] = useState<string>("")
  const [parameters, setParameters] = useState<Record<string, any>>({})

  const handleAdd = () => {
    if (!modType || !targetId) return

    let description = ""
    const trainNumber = trains.find((t) => t.id === Number.parseInt(targetId))?.trainNumber || targetId

    switch (modType) {
      case "delay_train":
        description = `Delay ${trainNumber} by ${parameters.delayMinutes || 10} minutes`
        break
      case "change_priority":
        description = `Change ${trainNumber} priority to ${parameters.newPriority || 5}`
        break
      case "cancel_train":
        description = `Cancel ${trainNumber}`
        break
      case "block_track":
        description = `Block track ${targetId} for ${parameters.duration || 30} minutes`
        break
    }

    onAdd({
      type: modType as any,
      targetId: Number.parseInt(targetId),
      parameters,
      description,
    })

    // Reset form
    setModType("")
    setTargetId("")
    setParameters({})
  }

  return (
    <div className="space-y-3 p-3 border rounded-lg">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Modification Type</Label>
          <Select value={modType} onValueChange={setModType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="delay_train">Delay Train</SelectItem>
              <SelectItem value="change_priority">Change Priority</SelectItem>
              <SelectItem value="cancel_train">Cancel Train</SelectItem>
              <SelectItem value="block_track">Block Track</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Target</Label>
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger>
              <SelectValue placeholder="Select target" />
            </SelectTrigger>
            <SelectContent>
              {modType === "block_track" ? (
                <>
                  <SelectItem value="1">Track 1 - Main Line North</SelectItem>
                  <SelectItem value="2">Track 2 - Main Line South</SelectItem>
                  <SelectItem value="3">Track 3 - East Branch</SelectItem>
                </>
              ) : (
                trains.map((train) => (
                  <SelectItem key={train.id} value={train.id.toString()}>
                    {train.trainNumber} ({train.trainType})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {modType === "delay_train" && (
        <div>
          <Label>Delay (minutes)</Label>
          <Input
            type="number"
            value={parameters.delayMinutes || ""}
            onChange={(e) => setParameters({ ...parameters, delayMinutes: Number.parseInt(e.target.value) || 0 })}
            placeholder="10"
          />
        </div>
      )}

      {modType === "change_priority" && (
        <div>
          <Label>New Priority (1-10)</Label>
          <Input
            type="number"
            min="1"
            max="10"
            value={parameters.newPriority || ""}
            onChange={(e) => setParameters({ ...parameters, newPriority: Number.parseInt(e.target.value) || 5 })}
            placeholder="5"
          />
        </div>
      )}

      {modType === "block_track" && (
        <div>
          <Label>Duration (minutes)</Label>
          <Input
            type="number"
            value={parameters.duration || ""}
            onChange={(e) => setParameters({ ...parameters, duration: Number.parseInt(e.target.value) || 30 })}
            placeholder="30"
          />
        </div>
      )}

      <Button onClick={handleAdd} disabled={!modType || !targetId} size="sm" className="w-full">
        <Plus className="h-3 w-3 mr-2" />
        Add Modification
      </Button>
    </div>
  )
}

function ScenarioResultsDisplay({ results }: { results: ScenarioResults }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Impact Analysis
          </CardTitle>
          <CardDescription>Comprehensive analysis of scenario outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg">
              <div className={`text-3xl font-bold ${getImpactColor(results.impactMetrics.totalDelayChange)}`}>
                {results.impactMetrics.totalDelayChange > 0 ? "+" : ""}
                {results.impactMetrics.totalDelayChange}
              </div>
              <p className="text-sm text-muted-foreground font-medium">Total Delay Change (min)</p>
              <div className="mt-2">
                {results.impactMetrics.totalDelayChange > 0 ? (
                  <Badge variant="destructive" className="text-xs">
                    Increased
                  </Badge>
                ) : results.impactMetrics.totalDelayChange < 0 ? (
                  <Badge variant="default" className="text-xs bg-green-600">
                    Improved
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    No Change
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg">
              <div className={`text-3xl font-bold ${getImpactColor(results.impactMetrics.conflictsChange)}`}>
                {results.impactMetrics.conflictsChange > 0 ? "+" : ""}
                {results.impactMetrics.conflictsChange}
              </div>
              <p className="text-sm text-muted-foreground font-medium">Conflicts Change</p>
              <div className="mt-2">
                {results.impactMetrics.conflictsChange > 0 ? (
                  <Badge variant="destructive" className="text-xs">
                    More Conflicts
                  </Badge>
                ) : results.impactMetrics.conflictsChange < 0 ? (
                  <Badge variant="default" className="text-xs bg-green-600">
                    Fewer Conflicts
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    No Change
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg">
              <div className="text-3xl font-bold text-primary">{results.impactMetrics.affectedTrains}</div>
              <p className="text-sm text-muted-foreground font-medium">Affected Trains</p>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {Math.round((results.impactMetrics.affectedTrains / sampleTrains.length) * 100)}% of fleet
                </Badge>
              </div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg">
              <div className={`text-3xl font-bold ${getImpactColor(-results.comparisonWithBaseline.throughputGain)}`}>
                {results.comparisonWithBaseline.throughputGain > 0 ? "+" : ""}
                {results.comparisonWithBaseline.throughputGain}%
              </div>
              <p className="text-sm text-muted-foreground font-medium">Throughput Change</p>
              <div className="mt-2">
                {results.comparisonWithBaseline.throughputGain > 0 ? (
                  <Badge variant="default" className="text-xs bg-green-600">
                    Improved
                  </Badge>
                ) : results.comparisonWithBaseline.throughputGain < 0 ? (
                  <Badge variant="destructive" className="text-xs">
                    Decreased
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    No Change
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance Metrics
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">On-Time Performance</span>
                    <span className="font-bold text-green-600">
                      {Math.max(0, 85 + results.comparisonWithBaseline.throughputGain)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(0, 85 + results.comparisonWithBaseline.throughputGain)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Platform Utilization</span>
                    <span className="font-bold">
                      {Math.min(100, Math.max(0, 78 - results.impactMetrics.conflictsChange * 5))}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, 78 - results.impactMetrics.conflictsChange * 5))}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Track Capacity Usage</span>
                    <span className="font-bold">
                      {Math.min(100, Math.max(0, 82 + results.impactMetrics.totalDelayChange))}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, 82 + results.impactMetrics.totalDelayChange))}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Passenger Satisfaction</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {Math.max(0, 4.2 - results.impactMetrics.totalDelayChange * 0.1).toFixed(1)}/5.0
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div
                        key={star}
                        className={`w-4 h-4 rounded-full ${
                          star <= Math.max(0, 4.2 - results.impactMetrics.totalDelayChange * 0.1)
                            ? "bg-blue-600"
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Energy Efficiency</span>
                    <span className="text-2xl font-bold text-green-600">
                      {Math.max(0, 92 + results.comparisonWithBaseline.throughputGain * 0.5).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Estimated energy savings vs baseline</p>
                </div>

                <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Cost Impact</span>
                    <span
                      className={`text-2xl font-bold ${
                        results.impactMetrics.totalDelayChange > 0 ? "text-red-500" : "text-green-600"
                      }`}
                    >
                      {results.impactMetrics.totalDelayChange > 0 ? "+" : ""}$
                      {(results.impactMetrics.totalDelayChange * 150).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Operational cost change per hour</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI Optimization Recommendations
          </CardTitle>
          <CardDescription>Actionable insights and next steps based on scenario results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {results.optimizationResult.suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                className="p-6 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border-l-4 border-primary"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">{getModificationIcon(suggestion.type)}</div>
                    <div>
                      <span className="font-semibold text-lg capitalize">
                        {suggestion.type?.replace("_", " ") || "Unknown"}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </Badge>
                        <Badge variant={suggestion.confidence > 0.8 ? "default" : "secondary"}>
                          {suggestion.confidence > 0.8 ? "High Priority" : "Consider"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">#{index + 1}</div>
                    <div className="text-xs text-muted-foreground">Recommendation</div>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4 leading-relaxed">{suggestion.description}</p>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-background rounded-lg border">
                    <div className={`text-xl font-bold ${getImpactColor(suggestion.impact.delayChange)}`}>
                      {suggestion.impact.delayChange > 0 ? "+" : ""}
                      {suggestion.impact.delayChange}min
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Delay Impact</div>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg border">
                    <div className="text-xl font-bold text-green-600">-{suggestion.impact.conflictsResolved}</div>
                    <div className="text-xs text-muted-foreground mt-1">Conflicts Resolved</div>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg border">
                    <div className="text-xl font-bold text-blue-600">+{suggestion.impact.throughputGain}%</div>
                    <div className="text-xs text-muted-foreground mt-1">Throughput Gain</div>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="default" className="flex-1 min-w-[120px]">
                    <Play className="h-3 w-3 mr-2" />
                    Implement Now
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 min-w-[120px] bg-transparent">
                    <Clock className="h-3 w-3 mr-2" />
                    Schedule for Later
                  </Button>
                  <Button size="sm" variant="ghost" className="flex-1 min-w-[120px]">
                    <Plus className="h-3 w-3 mr-2" />
                    Create Follow-up Scenario
                  </Button>
                </div>
              </div>
            ))}

            <div className="mt-8 p-6 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-primary">Executive Summary</h4>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {results.comparisonWithBaseline.throughputGain > 0
                      ? `This scenario demonstrates significant operational improvements with a ${results.comparisonWithBaseline.throughputGain}% throughput enhancement. The proposed changes align with efficiency objectives and should be prioritized for implementation.`
                      : `This scenario reveals operational challenges that require attention. The analysis suggests reviewing alternative approaches and considering the recommended modifications to optimize performance.`}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="default">
                      <BarChart3 className="h-3 w-3 mr-2" />
                      Export Detailed Report
                    </Button>
                    <Button size="sm" variant="outline">
                      <Train className="h-3 w-3 mr-2" />
                      Share with Operations Team
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                    <span className="text-sm font-medium">Overall Impact Score</span>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-bold text-primary">
                        {Math.max(1, Math.min(10, 7 + results.comparisonWithBaseline.throughputGain * 0.5)).toFixed(1)}
                        /10
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div
                            key={star}
                            className={`w-3 h-3 rounded-full ${
                              star <=
                              Math.max(1, Math.min(10, 7 + results.comparisonWithBaseline.throughputGain * 0.5)) / 2
                                ? "bg-primary"
                                : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                    <span className="text-sm font-medium">Implementation Complexity</span>
                    <Badge variant={results.optimizationResult.suggestions.length > 3 ? "destructive" : "default"}>
                      {results.optimizationResult.suggestions.length > 3 ? "High" : "Medium"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                    <span className="text-sm font-medium">Risk Level</span>
                    <Badge variant={results.impactMetrics.conflictsChange > 0 ? "destructive" : "secondary"}>
                      {results.impactMetrics.conflictsChange > 0 ? "Elevated" : "Low"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getModificationIcon(type: string) {
  switch (type) {
    case "delay_train":
      return <Clock className="h-4 w-4" />
    case "block_track":
      return <AlertTriangle className="h-4 w-4" />
    case "change_priority":
      return <TrendingUp className="h-4 w-4" />
    case "add_train":
      return <Plus className="h-4 w-4" />
    case "cancel_train":
      return <Trash2 className="h-4 w-4" />
    default:
      return <Settings className="h-4 w-4" />
  }
}

function getImpactColor(value: number): string {
  if (value > 0) return "text-red-500"
  if (value < 0) return "text-green-500"
  return "text-muted-foreground"
}
