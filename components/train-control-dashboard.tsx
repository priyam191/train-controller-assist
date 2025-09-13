"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Train, Clock, MapPin, Activity, Zap, RefreshCw, AlertTriangle } from "lucide-react"
import type { OptimizationResult } from "@/lib/types"
import { TrainSimulationMap } from "./train-simulation-map"
import { WhatIfScenarios } from "./what-if-scenarios"

const sampleTrains = [
  {
    id: 1,
    number: "EXP001",
    type: "express",
    priority: 9,
    status: "running",
    currentLocation: "Central Station",
    delay: 0,
  },
  {
    id: 2,
    number: "FRT205",
    type: "freight",
    priority: 3,
    status: "scheduled",
    currentLocation: "North Junction",
    delay: 0,
  },
  {
    id: 3,
    number: "PSG112",
    type: "passenger",
    priority: 6,
    status: "running",
    currentLocation: "Approaching Central",
    delay: 3,
  },
  {
    id: 4,
    number: "LOC089",
    type: "local",
    priority: 4,
    status: "delayed",
    currentLocation: "East Station",
    delay: 12,
  },
]

const sampleConflicts = [
  {
    id: 1,
    type: "platform",
    location: "Central Station Platform 3",
    severity: "medium",
    trains: ["EXP001", "PSG112"],
    suggestion: "Delay PSG112 by 5 minutes",
  },
  {
    id: 2,
    type: "track_capacity",
    location: "Main Line South",
    severity: "high",
    trains: ["FRT205", "LOC089"],
    suggestion: "Hold FRT205 until LOC089 clears",
  },
]

export function TrainControlDashboard() {
  const [selectedTrain, setSelectedTrain] = useState<number | null>(null)
  const [optimizationData, setOptimizationData] = useState<OptimizationResult | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [conflictMode, setConflictMode] = useState(false)
  const [activeConflicts, setActiveConflicts] = useState(sampleConflicts)

  useEffect(() => {
    fetchOptimizationData()
    if (conflictMode) {
      const interval = setInterval(fetchConflicts, 5000)
      return () => clearInterval(interval)
    }
  }, [conflictMode])

  const fetchOptimizationData = async () => {
    try {
      const response = await fetch("/api/optimization")
      const data = await response.json()
      setOptimizationData(data)
    } catch (error) {
      console.error("Failed to fetch optimization data:", error)
    }
  }

  const fetchConflicts = async () => {
    try {
      const response = await fetch("/api/conflicts")
      const data = await response.json()
      setActiveConflicts(data)
    } catch (error) {
      console.error("Failed to fetch conflicts:", error)
    }
  }

  const resolveConflict = async (conflictId: number, action: string) => {
    try {
      await fetch("/api/conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conflictId, action }),
      })
      fetchConflicts()
    } catch (error) {
      console.error("Failed to resolve conflict:", error)
    }
  }

  const runOptimization = async () => {
    setIsOptimizing(true)
    try {
      const response = await fetch("/api/optimization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trains: sampleTrains, schedules: [] }),
      })
      const result = await response.json()
      setOptimizationData(result)
    } catch (error) {
      console.error("Optimization failed:", error)
    } finally {
      setIsOptimizing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-500"
      case "delayed":
        return "bg-red-500"
      case "scheduled":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Train Control Center</h1>
          <p className="text-muted-foreground">Real-time optimization and conflict resolution</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            System Active
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            AI Optimization: ON
          </Badge>
          <Button
            onClick={() => setConflictMode(!conflictMode)}
            variant={conflictMode ? "destructive" : "outline"}
            size="sm"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            {conflictMode ? "Exit Conflict Mode" : "Conflict Mode"}
          </Button>
          <Button onClick={runOptimization} disabled={isOptimizing} variant="outline" size="sm">
            {isOptimizing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {isOptimizing ? "Optimizing..." : "Run Optimization"}
          </Button>
        </div>
      </div>

      {conflictMode && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <div>
                <h3 className="font-semibold text-destructive">Conflict Resolution Mode Active</h3>
                <p className="text-sm text-muted-foreground">
                  System prioritizing conflict detection and resolution. Auto-refreshing every 5 seconds.
                </p>
              </div>
              <div className="ml-auto">
                <Badge variant="destructive">{activeConflicts.length} Active Conflicts</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={conflictMode ? "conflicts" : "overview"} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trains">Train Status</TabsTrigger>
          <TabsTrigger value="conflicts" className={conflictMode ? "bg-destructive/20" : ""}>
            Conflicts {conflictMode && `(${activeConflicts.length})`}
          </TabsTrigger>
          <TabsTrigger value="simulation">Live Simulation</TabsTrigger>
          <TabsTrigger value="scenarios">What-If</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Trains</CardTitle>
                <Train className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-muted-foreground">2 running, 1 delayed, 1 scheduled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Conflicts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">2</div>
                <p className="text-xs text-muted-foreground">1 high priority, 1 medium</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Delay</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.8 min</div>
                <p className="text-xs text-green-600">↓ 2.1 min from yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  Throughput
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94%</div>
                <p className="text-xs text-green-600">↑ 5% optimization gain</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-secondary" />
                AI Optimization Suggestions
                {optimizationData && (
                  <Badge variant="outline" className="ml-auto">
                    {optimizationData.suggestions.length} suggestions
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Real-time recommendations to improve system efficiency
                {optimizationData && (
                  <span className="block mt-1 text-xs">
                    Last optimization: {optimizationData.executionTimeMs}ms • Conflicts resolved:{" "}
                    {optimizationData.conflictsResolved} • Throughput gain: +{optimizationData.throughputImprovement}%
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {optimizationData?.suggestions.map((suggestion) => (
                <div key={suggestion.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {suggestion.type === "delay" && <Clock className="h-5 w-5 text-secondary" />}
                    {suggestion.type === "reroute" && <MapPin className="h-5 w-5 text-primary" />}
                    {suggestion.type === "platform_change" && <Train className="h-5 w-5 text-accent" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium capitalize">{suggestion.type?.replace("_", " ") || "Unknown"}</p>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      <span>
                        Delay: {suggestion.impact.delayChange > 0 ? "+" : ""}
                        {suggestion.impact.delayChange}min
                      </span>
                      <span>Conflicts: -{suggestion.impact.conflictsResolved}</span>
                      <span>Throughput: +{suggestion.impact.throughputGain}%</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary">
                        Apply Suggestion
                      </Button>
                      <Button size="sm" variant="outline">
                        Simulate Impact
                      </Button>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-4 text-muted-foreground">
                  <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Run optimization to generate AI suggestions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Train Status Monitor</CardTitle>
              <CardDescription>Real-time status of all active trains</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sampleTrains.map((train) => (
                  <div
                    key={train.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedTrain(train.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(train.status)}`} />
                      <div>
                        <p className="font-medium">{train.number}</p>
                        <p className="text-sm text-muted-foreground">
                          {train.type} • Priority {train.priority}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{train.currentLocation}</p>
                      {train.delay > 0 && <p className="text-sm text-destructive">+{train.delay} min delay</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Critical Conflicts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {activeConflicts.filter((c) => c.severity === "high").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Auto-Resolved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">12</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Avg Resolution Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.3 min</div>
                <p className="text-xs text-green-600">↓ 30s from yesterday</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Active Conflicts
                {conflictMode && <Badge variant="outline">Live Updates</Badge>}
              </CardTitle>
              <CardDescription>System-detected conflicts requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeConflicts.map((conflict) => (
                  <div key={conflict.id} className="p-4 border rounded-lg bg-card">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <AlertTriangle
                          className={`h-5 w-5 ${conflict.severity === "high" ? "text-destructive" : "text-yellow-500"}`}
                        />
                        <div>
                          <span className="font-medium capitalize">
                            {conflict.type?.replace("_", " ") || "Unknown"}
                          </span>
                          <Badge variant={getSeverityColor(conflict.severity)} className="ml-2">
                            {conflict.severity}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {conflict.location}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Trains Involved</p>
                        <p className="text-sm text-muted-foreground">
                          {conflict.trains?.join(", ") || "No trains specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Estimated Impact</p>
                        <p className="text-sm text-muted-foreground">
                          {conflict.severity === "high" ? "+15-20 min delay" : "+5-10 min delay"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-3 rounded-lg mb-4">
                      <p className="text-sm font-medium mb-1">AI Recommendation</p>
                      <p className="text-sm">{conflict.suggestion}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => resolveConflict(conflict.id, "resolve")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Apply Resolution
                      </Button>
                      <Button size="sm" variant="outline">
                        Test in What-If
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => resolveConflict(conflict.id, "ignore")}>
                        Ignore
                      </Button>
                    </div>
                  </div>
                ))}

                {activeConflicts.length === 0 && (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-lg font-medium text-green-600">No Active Conflicts</p>
                    <p className="text-sm text-muted-foreground">All systems operating normally</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulation" className="space-y-4">
          <TrainSimulationMap />
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <WhatIfScenarios />
        </TabsContent>
      </Tabs>
    </div>
  )
}
