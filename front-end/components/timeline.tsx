"use client"

import { CheckCircle, Clock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimelineItem {
  title: string
  description: string
  status: "completed" | "current" | "pending"
  timestamp?: string
}

interface TimelineProps {
  items: TimelineItem[]
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2",
                item.status === "completed" && "bg-green-500 border-green-500 text-white",
                item.status === "current" && "bg-blue-500 border-blue-500 text-white",
                item.status === "pending" && "bg-muted border-muted-foreground text-muted-foreground",
              )}
            >
              {item.status === "completed" && <CheckCircle className="h-4 w-4" />}
              {item.status === "current" && <Clock className="h-4 w-4" />}
              {item.status === "pending" && <AlertCircle className="h-4 w-4" />}
            </div>
            {index < items.length - 1 && (
              <div className={cn("w-0.5 h-8 mt-2", item.status === "completed" ? "bg-green-500" : "bg-muted")} />
            )}
          </div>
          <div className="flex-1 pb-8">
            <h3
              className={cn(
                "font-medium",
                item.status === "completed" && "text-green-700 dark:text-green-400",
                item.status === "current" && "text-blue-700 dark:text-blue-400",
                item.status === "pending" && "text-muted-foreground",
              )}
            >
              {item.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
            {item.timestamp && <p className="text-xs text-muted-foreground mt-2">{item.timestamp}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
