"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  username: string
  role: string
  loginTime: string
}

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      console.log("[v0] AuthGuard: Checking authentication...")
      const userData = localStorage.getItem("trainController")
      console.log("[v0] AuthGuard: localStorage data:", userData)

      if (userData) {
        try {
          const parsedUser = JSON.parse(userData)
          console.log("[v0] AuthGuard: Parsed user:", parsedUser)
          setUser(parsedUser)
        } catch (error) {
          console.log("[v0] AuthGuard: Error parsing user data:", error)
          localStorage.removeItem("trainController")
          router.push("/login")
        }
      } else {
        console.log("[v0] AuthGuard: No user data found, redirecting to login")
        router.push("/login")
      }
      setIsLoading(false)
    }

    const timer = setTimeout(checkAuth, 100)
    return () => clearTimeout(timer)
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  console.log("[v0] AuthGuard: User authenticated, rendering children")
  return <>{children}</>
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("trainController")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const logout = () => {
    localStorage.removeItem("trainController")
    setUser(null)
    window.location.href = "/login"
  }

  return { user, logout }
}
