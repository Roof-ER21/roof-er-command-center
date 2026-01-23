import { useState, useEffect, type ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/useToast';
import type { Candidate } from '@shared/schema';

interface SourcerAssignmentDialogProps {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Sourcer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  activeAssignments: number;
}

export function SourcerAssignmentDialog({ candidate, open, onOpenChange }: SourcerAssignmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSourcer, setSelectedSourcer] = useState<string>('');
  const [role, setRole] = useState<string>('PRIMARY');
  const [notes, setNotes] = useState<string>('');
  const [referralName, setReferralName] = useState<string>('');
  const [referralSource, setReferralSource] = useState<string>('');

  // Reset form when dialog opens/candidate changes
  useEffect(() => {
    if (open && candidate) {
      setSelectedSourcer(candidate.assignedTo ? String(candidate.assignedTo) : '');
      setRole('PRIMARY');
      setNotes('');
      setReferralName(candidate.referralName || '');
      setReferralSource('');
    }
  }, [open, candidate]);

  // Fetch available sourcers
  const { data: sourcers = [], isLoading: isLoadingSourcers } = useQuery<Sourcer[]>({
    queryKey: ['/api/hr/sourcers/available'],
    enabled: open, // Only fetch when dialog is open
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!candidate || !selectedSourcer) return;

      // First, update referral information if provided
      if (referralName.trim()) {
        await apiRequest('PATCH', `/api/hr/candidates/${candidate.id}`, {
          referralName: referralName.trim(),
        });
      }

      const res = await apiRequest('POST', `/api/hr/candidates/${candidate.id}/assign-sourcer`, {
        hrMemberId: parseInt(selectedSourcer),
        role,
        notes: notes.trim() || undefined,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/candidates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hr/sourcers/available'] });
      toast({
        title: 'Assignment Updated',
        description: `Candidate assigned to sourcer successfully.`,
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Assignment Failed',
        description: error.message || 'Failed to assign sourcer.',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    if (!selectedSourcer) return;
    assignMutation.mutate();
  };

  if (!candidate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Sourcer</DialogTitle>
          <DialogDescription>
            Assign a sourcer to <strong>{candidate.firstName} {candidate.lastName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Select Sourcer</Label>
            <Select value={selectedSourcer} onValueChange={setSelectedSourcer}>
              <SelectTrigger>
                <SelectValue placeholder="Select a sourcer" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingSourcers ? (
                  <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  sourcers.map((sourcer) => (
                    <SelectItem key={sourcer.id} value={String(sourcer.id)}>
                      <div className="flex items-center justify-between w-full min-w-[200px]">
                        <span>{sourcer.firstName} {sourcer.lastName}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({sourcer.activeAssignments} active)
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIMARY">Primary (Updates Candidate Owner)</SelectItem>
                <SelectItem value="SECONDARY">Secondary (Support)</SelectItem>
                <SelectItem value="BACKUP">Backup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assignment Notes</Label>
            <Textarea
              placeholder="Add context for this assignment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Referred By (Optional)</Label>
            <Input
              placeholder="Enter referrer's name"
              value={referralName}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setReferralName(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Track who referred this candidate
            </p>
          </div>

          <div className="space-y-2">
            <Label>Referral Source (Optional)</Label>
            <Select value={referralSource} onValueChange={setReferralSource}>
              <SelectTrigger>
                <SelectValue placeholder="Select referral source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee Referral</SelectItem>
                <SelectItem value="external">External Referral</SelectItem>
                <SelectItem value="job_fair">Job Fair</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="indeed">Indeed</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={assignMutation.isPending || !selectedSourcer}>
            {assignMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              'Save Assignment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
