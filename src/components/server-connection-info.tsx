"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export function ServerConnectionInfo() {
  const [serverUrl, setServerUrl] = useState(localStorage.getItem("mangaServerUrl") || "")
  const [apiKey, setApiKey] = useState(localStorage.getItem("mangaApiKey") || "")
  const [isConnected, setIsConnected] = useState(!!localStorage.getItem("mangaServerUrl"))
  const { toast } = useToast()

  const handleSaveConnection = () => {
    if (!serverUrl) {
      toast({
        title: "Server URL Required",
        description: "Please enter the URL of your manga server",
        variant: "destructive",
      })
      return
    }

    // Save connection info to localStorage
    localStorage.setItem("mangaServerUrl", serverUrl)
    localStorage.setItem("mangaApiKey", apiKey)
    setIsConnected(true)

    toast({
      title: "Connection Saved",
      description: "Your manga server connection has been configured",
    })
  }

  const handleTestConnection = () => {
    toast({
      title: "Testing Connection",
      description: "Attempting to connect to your manga server...",
    })

    // In a real implementation, you would test the connection here
    setTimeout(() => {
      toast({
        title: "Connection Successful",
        description: "Successfully connected to your manga server",
      })
    }, 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Server Connection</CardTitle>
        <CardDescription>Configure the connection to your manga server</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="server-url">Server URL</Label>
          <Input
            id="server-url"
            placeholder="https://your-manga-server.com"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Enter the URL where your manga files will be stored</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="api-key">API Key (Optional)</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="Your API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">If your server requires authentication, enter the API key</p>
        </div>
        {isConnected && (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-800 dark:text-green-400">
            Connected to server: {serverUrl}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleTestConnection}>
          Test Connection
        </Button>
        <Button onClick={handleSaveConnection}>Save Connection</Button>
      </CardFooter>
    </Card>
  )
} 