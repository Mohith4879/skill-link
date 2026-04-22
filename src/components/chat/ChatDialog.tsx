import { useEffect, useRef, useState } from "react";
import { Send, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface Props {
  bookingId: string | null;
  otherName: string;
  onClose: () => void;
}

export default function ChatDialog({ bookingId, otherName, onClose }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bookingId || !user) return;
    let active = true;

    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("booking_id", bookingId)
        .order("created_at");
      if (active && data) setMessages(data as Message[]);
    };
    load();

    const channel = supabase
      .channel(`chat-${bookingId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `booking_id=eq.${bookingId}` },
        (payload) => {
          setMessages((prev) =>
            prev.some((m) => m.id === (payload.new as Message).id)
              ? prev
              : [...prev, payload.new as Message]
          );
        }
      )
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [bookingId, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || !bookingId || !user) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    const { error } = await supabase.from("messages").insert({
      booking_id: bookingId,
      sender_id: user.id,
      content: text,
    });
    if (error) setInput(text); // restore on error
    setSending(false);
  };

  return (
    <Dialog open={!!bookingId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b border-border">
          <DialogTitle className="font-display flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Chat with {otherName}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-80 px-5 py-3" ref={scrollRef as any}>
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              No messages yet. Say hi 👋
            </p>
          ) : (
            <div className="space-y-2">
              {messages.map((m) => {
                const mine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                        mine
                          ? "gradient-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <p className={cn("text-[10px] mt-0.5 opacity-70", mine ? "text-primary-foreground" : "text-muted-foreground")}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <div className="border-t border-border p-3 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type a message..."
            disabled={sending}
          />
          <Button onClick={send} disabled={!input.trim() || sending} size="icon" className="gradient-cta text-primary-foreground border-0 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}