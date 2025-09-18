"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Train, Shield, User } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Predefined credentials
  const validCredentials = [
    { username: "controller1", password: "train2024", role: "Senior Controller" },
    { username: "controller2", password: "railway123", role: "Operations Manager" },
    { username: "admin", password: "admin123", role: "System Administrator" },
  ]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const cleanUsername = username.trim().replace(/[`'"]/g, "")
    const cleanPassword = password.trim().replace(/[`'"]/g, "")

    console.log("[v0] Raw username:", JSON.stringify(username))
    console.log("[v0] Raw password:", JSON.stringify(password))
    console.log("[v0] Clean username:", JSON.stringify(cleanUsername))
    console.log("[v0] Clean password:", JSON.stringify(cleanPassword))
    console.log("[v0] Username length:", cleanUsername.length)
    console.log("[v0] Password length:", cleanPassword.length)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const validUser = validCredentials.find((cred) => {
      const usernameMatch = cred.username === cleanUsername
      const passwordMatch = cred.password === cleanPassword
      console.log(`[v0] Checking ${cred.username}: username match=${usernameMatch}, password match=${passwordMatch}`)
      return usernameMatch && passwordMatch
    })

    console.log("[v0] Found valid user:", validUser)

    if (validUser) {
      // Store user session
      const userData = {
        username: validUser.username,
        role: validUser.role,
        loginTime: new Date().toISOString(),
      }
      console.log("[v0] Storing user data:", userData)
      localStorage.setItem("trainController", JSON.stringify(userData))
      router.push("/")
    } else {
      console.log("[v0] Login failed - invalid credentials")
      setError("Invalid username or password")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <Train className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Train Control System</h1>
          <p className="text-muted-foreground">Controller Access Portal</p>
        </div>

        {/* Login Form */}
        <Card className="backdrop-blur-sm bg-card/95 border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Shield className="h-5 w-5" />
              Controller Login
            </CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the control system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Authenticating..." : "Login"}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">Demo Credentials:</h3>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>controller1 / train2024</div>
                <div>controller2 / railway123</div>
                <div>admin / admin123</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
