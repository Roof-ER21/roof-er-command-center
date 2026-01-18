import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, Phone, MapPin, Calendar, Briefcase, Star, UserPlus } from 'lucide-react';
import { CandidateNotes } from './CandidateNotes';
import { SourcerAssignmentDialog } from './SourcerAssignmentDialog';
import type { Candidate } from '@shared/schema';

interface CandidateDetailsDialogProps {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeLookup: Map<number, string>;
}

export function CandidateDetailsDialog({ candidate, open, onOpenChange, employeeLookup }: CandidateDetailsDialogProps) {
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  if (!candidate) return null;

  const assignedName = candidate.assignedTo ? employeeLookup.get(candidate.assignedTo) : 'Unassigned';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
          <div className="p-6 border-b">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                  {candidate.firstName?.[0]}{candidate.lastName?.[0]}
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold">
                    {candidate.firstName} {candidate.lastName}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span>{candidate.position}</span>
                    <Badge variant="secondary" className="capitalize ml-2">
                      {candidate.status}
                    </Badge>
                    {candidate.isArchived && <Badge variant="outline">Archived</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAssignDialog(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign Sourcer
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex">
            <div className="w-1/3 border-r p-6 bg-muted/10 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Contact Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${candidate.email}`} className="hover:underline text-primary">
                      {candidate.email}
                    </a>
                  </div>
                  {candidate.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${candidate.phone}`} className="hover:underline">
                        {candidate.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source</span>
                    <span>{candidate.source || 'Direct'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating</span>
                    <span className="flex items-center gap-1">
                      {candidate.rating || '-'} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Applied</span>
                    <span>{new Date(candidate.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned To</span>
                    <span className="font-medium">{assignedName}</span>
                  </div>
                  {candidate.resumeUrl && (
                    <div className="pt-2">
                      <Button variant="outline" className="w-full" asChild>
                        <a href={candidate.resumeUrl} target="_blank" rel="noreferrer">
                          View Resume
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto bg-background">
              <Tabs defaultValue="notes" className="h-full flex flex-col">
                <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 mb-4 h-auto">
                  <TabsTrigger 
                    value="notes" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                  >
                    Notes & History
                  </TabsTrigger>
                  {/* Add more tabs here later like 'Interviews', 'Emails' */}
                </TabsList>
                <TabsContent value="notes" className="flex-1 mt-0">
                  <CandidateNotes candidateId={candidate.id} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SourcerAssignmentDialog
        candidate={candidate}
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
      />
    </>
  );
}