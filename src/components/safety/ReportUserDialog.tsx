import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Flag } from "lucide-react";

const REASONS = [
  { value: "inappropriate", label: "Inappropriate behavior" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "spam", label: "Spam or scam" },
  { value: "no_show", label: "No-show / didn't deliver session" },
  { value: "other", label: "Other" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reportedUserId: string;
  reportedUserName?: string;
}

export default function ReportUserDialog({ open, onOpenChange, reportedUserId, reportedUserName }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState("inappropriate");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_id: reportedUserId,
      reason,
      details: details.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't submit report", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Report submitted", description: "Thanks — our team will review it." });
    setDetails("");
    setReason("inappropriate");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Flag className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center font-display">Report {reportedUserName || "user"}</DialogTitle>
          <DialogDescription className="text-center">
            Reports are confidential. Our team reviews every submission.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Reason</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="space-y-1.5">
              {REASONS.map((r) => (
                <label key={r.value} className="flex items-center gap-2 rounded-lg border border-border p-2.5 cursor-pointer hover:bg-muted/50 transition-smooth">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label className="text-sm" htmlFor="details">Additional details (optional)</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Share what happened..."
              rows={3}
              maxLength={500}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting} variant="destructive">
            {submitting ? "Submitting..." : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}