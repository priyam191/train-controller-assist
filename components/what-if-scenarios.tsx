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
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getImpactColor(results.impactMetrics.totalDelayChange)}`}>
                {results.impactMetrics.totalDelayChange > 0 ? "+" : ""}
                {results.impactMetrics.totalDelayChange}
              </div>
              <p className="text-sm text-muted-foreground">Total Delay Change (min)</p>
            </div>

            <div className="text-center">
              <div className={`text-2xl font-bold ${getImpactColor(results.impactMetrics.conflictsChange)}`}>
                {results.impactMetrics.conflictsChange > 0 ? "+" : ""}
                {results.impactMetrics.conflictsChange}
              </div>
              <p className="text-sm text-muted-foreground">Conflicts Change</p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{results.impactMetrics.affectedTrains}</div>
              <p className="text-sm text-muted-foreground">Affected Trains</p>
            </div>

            <div className="text-center">
              <div className={`text-2xl font-bold ${getImpactColor(-results.comparisonWithBaseline.throughputGain)}`}>
                {results.comparisonWithBaseline.throughputGain > 0 ? "+" : ""}
                {results.comparisonWithBaseline.throughputGain}%
              </div>
              <p className="text-sm text-muted-foreground">Throughput Change</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Optimization Suggestions</CardTitle>
          <CardDescription>AI-generated recommendations for this scenario</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results.optimizationResult.suggestions.map((suggestion) => (
              <div key={suggestion.id} className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{suggestion.type.replace("_", " ")}</span>
                  <Badge variant="outline">{Math.round(suggestion.confidence * 100)}% confidence</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>
                    Impact: {suggestion.impact.delayChange > 0 ? "+" : ""}
                    {suggestion.impact.delayChange}min
                  </span>
                  <span>Throughput: +{suggestion.impact.throughputGain}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getImpactColor(value: number): string {
  if (value > 0) return "text-red-500"
  if (value < 0) return "text-green-500"
  return "text-muted-foreground"
}
