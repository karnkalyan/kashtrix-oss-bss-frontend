"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { apiRequest } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
  ChevronDown,
  ChevronUp,
  EyeOff,
  ExternalLink,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"

interface CustomerTicketsProps {
  customerId: number
  headingVariant?: "default" | "profile"
}

interface Ticket {
  id: number
  ticketNumber: string
  title: string
  description?: string
  status: string
  priority: string
  category?: string
  createdAt: string
  updatedAt: string
  assignedTo?: { id: number; name: string; email: string }
  _count?: { comments: number }
  comments?: TicketComment[]
}

interface TicketComment {
  id: number
  content: string
  createdAt: string
  user: { id: number; name: string; email: string }
}

export function CustomerTickets({ customerId, headingVariant = "default" }: CustomerTicketsProps) {
  const { hasPermission } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [expandedTicket, setExpandedTicket] = useState<number | null>(null)
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showCommentsEnabled, setShowCommentsEnabled] = useState<boolean | null>(null)

  // Create form
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newPriority, setNewPriority] = useState("MEDIUM")
  const [newCategory, setNewCategory] = useState("")

  // Fetch the global setting for ticket comment visibility
  const fetchCommentSetting = async () => {
    try {
      const settings = await apiRequest<Record<string, string>>("/settings")
      const value = settings?.show_ticket_comments_to_customer
      setShowCommentsEnabled(value === "true" || value === "Enable")
    } catch {
      setShowCommentsEnabled(true) // default to showing comments on error
    }
  }

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const data = await apiRequest<Ticket[]>(`/tickets/customer/${customerId}`)
      setTickets(data || [])
    } catch (error: any) {
      console.error("Error fetching tickets:", error)
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCommentSetting()
    if (customerId) fetchTickets()
  }, [customerId])

  const handleCreateTicket = async () => {
    if (!newTitle.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      await apiRequest("/tickets", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          priority: newPriority,
          category: newCategory,
          customerId,
        }),
      })
      toast({ title: "Success", description: "Ticket created successfully" })
      setShowCreateDialog(false)
      setNewTitle("")
      setNewDescription("")
      setNewPriority("MEDIUM")
      setNewCategory("")
      fetchTickets()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddComment = async (ticketId: number) => {
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      await apiRequest(`/tickets/${ticketId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: newComment }),
      })
      toast({ title: "Comment added" })
      setNewComment("")
      // Refresh the ticket detail
      const updatedTicket = await apiRequest<Ticket>(`/tickets/${ticketId}`)
      if (updatedTicket) {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updatedTicket } : t))
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const loadTicketDetails = async (ticketId: number) => {
    if (expandedTicket === ticketId) {
      setExpandedTicket(null)
      return
    }
    try {
      const detail = await apiRequest<Ticket>(`/tickets/${ticketId}`)
      if (detail) {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...detail } : t))
      }
      setExpandedTicket(ticketId)
    } catch (error: any) {
      console.error("Error loading ticket details:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-blue-500"
      case "IN_PROGRESS": return "bg-amber-500"
      case "RESOLVED": return "bg-green-500"
      case "CLOSED": return "bg-gray-500"
      default: return "bg-gray-500"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "bg-red-500 text-white"
      case "HIGH": return "bg-orange-500 text-white"
      case "MEDIUM": return "bg-yellow-500 text-black"
      case "LOW": return "bg-green-500 text-white"
      default: return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className={headingVariant === "profile" ? "customer-tab-heading" : "flex items-center justify-between"}>
        <div className={headingVariant === "profile" ? "customer-tab-heading-copy" : "flex items-center gap-2"}>
          {headingVariant === "profile" ? (
            <span className="customer-tab-heading-icon" aria-hidden="true">
              <LifeBuoy className="h-5 w-5" />
            </span>
          ) : (
            <LifeBuoy className="h-5 w-5 text-primary" />
          )}
          <div className={headingVariant === "profile" ? "min-w-0" : "flex items-center gap-2"}>
            {headingVariant === "profile" && <p className="customer-tab-heading-eyebrow">Customer care</p>}
            <div className="flex items-center gap-2">
              <h3 className={headingVariant === "profile" ? "customer-tab-heading-title" : "text-lg font-semibold"}>Support Tickets</h3>
              <Badge variant="secondary">{tickets.length}</Badge>
            </div>
            {headingVariant === "profile" && (
              <p className="customer-tab-heading-description">
                Track open requests, service incidents, ownership, and resolution progress for this account.
              </p>
            )}
          </div>
        </div>
        <div className={headingVariant === "profile" ? "customer-tab-heading-actions" : "flex items-center gap-2"}>
          {showCommentsEnabled === false && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full">
              <EyeOff className="h-3 w-3" />
              <span>Comments hidden from customers</span>
            </div>
          )}
          {hasPermission("tickets_create") && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm hover:shadow-md transition-all">
                <Plus className="h-4 w-4" /> Create Ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Support Ticket</DialogTitle>
                <DialogDescription>Create a new support ticket for this customer.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Brief description of the issue" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Detailed description..." rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={newPriority} onValueChange={setNewPriority}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="connectivity">Connectivity</SelectItem>
                        <SelectItem value="account">Account</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateTicket} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Ticket
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900">
          <LifeBuoy className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium">No Support Tickets</h3>
          <p className="text-muted-foreground">No tickets have been created for this customer yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div
                className="p-4 cursor-pointer flex items-center justify-between"
                onClick={() => loadTicketDetails(ticket.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/tickets/${ticket.id}`} onClick={e => e.stopPropagation()} className="font-mono text-xs font-bold text-primary hover:underline flex items-center gap-1">
                        {ticket.ticketNumber} <ExternalLink className="h-3 w-3" />
                      </Link>
                      <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
                      <Badge className={getPriorityColor(ticket.priority)} variant="outline">{ticket.priority}</Badge>
                      {ticket.category && <Badge variant="outline" className="text-xs">{ticket.category}</Badge>}
                    </div>
                    <span className="font-medium">{ticket.title}</span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      {ticket.assignedTo && <span>Assigned: {ticket.assignedTo.name}</span>}
                      {ticket._count && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {ticket._count.comments} comments
                          {!showCommentsEnabled && (
                            <span className="text-amber-500 flex items-center gap-0.5 ml-1">
                              <EyeOff className="h-3 w-3" /> hidden from customer
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {expandedTicket === ticket.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>

              {expandedTicket === ticket.id && (
                <div className="border-t px-4 pb-4 pt-3 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex justify-end">
                    <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs font-semibold">
                      <Link href={`/tickets/${ticket.id}`}>
                        <ExternalLink className="h-3.5 w-3.5 text-blue-600" /> View Ticket Details Page
                      </Link>
                    </Button>
                  </div>
                  {ticket.description && (
                    <div className="text-sm text-muted-foreground bg-white dark:bg-slate-800 p-3 rounded-lg border">
                      {ticket.description}
                    </div>
                  )}

                  {/* Comments — shown if setting is enabled OR if the viewer is admin (always show for admins) */}
                  {showCommentsEnabled !== false ? (
                    <>
                      {ticket.comments && ticket.comments.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" /> Comments ({ticket.comments.length})
                          </h4>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {ticket.comments.map((comment) => (
                              <div key={comment.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border text-sm">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-xs">{comment.user?.name || "System"}</span>
                                  <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</span>
                                </div>
                                <p className="text-muted-foreground">{comment.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add Comment */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment(ticket.id)}
                          className="flex-1"
                        />
                        <Button
                          size="icon"
                          onClick={() => handleAddComment(ticket.id)}
                          disabled={submitting || !newComment.trim()}
                        >
                          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                      <EyeOff className="h-4 w-4 flex-shrink-0" />
                      <span>Ticket comments are currently hidden from customer view. Enable <strong>Customer Ticket Comments</strong> in master settings to show them.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
