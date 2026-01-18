import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, User, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

interface CandidateNote {
  id: number;
  candidateId: number;
  authorId: number;
  content: string;
  type: 'GENERAL' | 'INTERVIEW' | 'REFERENCE' | 'INTERNAL';
  createdAt: string;
  author?: {
    firstName: string;
    lastName: string;
  };
}

interface CandidateNotesProps {
  candidateId: number;
}

const noteTypeConfig = {
  GENERAL: { label: 'General', color: 'bg-gray-100 text-gray-800' },
  INTERVIEW: { label: 'Interview', color: 'bg-blue-100 text-blue-800' },
  REFERENCE: { label: 'Reference', color: 'bg-green-100 text-green-800' },
  INTERNAL: { label: 'Internal', color: 'bg-orange-100 text-orange-800' }
};

export function CandidateNotes({ candidateId }: CandidateNotesProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'GENERAL' | 'INTERVIEW' | 'REFERENCE' | 'INTERNAL'>('GENERAL');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Fetch notes
  const { data: notes = [], isLoading } = useQuery<CandidateNote[]>({
    queryKey: [`/api/hr/candidates/${candidateId}/notes`],
    enabled: !!candidateId,
    staleTime: 0,
  });

  // Fetch users to get author names (if not populated by server)
  // Actually, let's assume we map it here or server does it.
  // The server implementation I wrote returns raw table data.
  // I should probably fetch users to map names if I didn't join on server.
  // I didn't join on server. So I need to fetch users.
  const { data: users = [] } = useQuery<Array<{ id: number; firstName: string; lastName: string }>>({
    queryKey: ['/api/hr/employees'], // Using employees endpoint which returns users
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: (data: { content: string; type: string }) =>
      apiRequest('POST', `/api/hr/candidates/${candidateId}/notes`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hr/candidates/${candidateId}/notes`] });
      setNewNote('');
      setIsAddingNote(false);
      toast({
        title: 'Note added',
        description: 'The note has been added successfully.'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add note.',
        variant: 'destructive'
      });
    }
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: number) =>
      apiRequest('DELETE', `/api/hr/candidates/notes/${noteId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hr/candidates/${candidateId}/notes`] });
      toast({
        title: 'Note deleted',
        description: 'The note has been deleted successfully.'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete note.',
        variant: 'destructive'
      });
    }
  });

  const handleAddNote = () => {
    if (newNote.trim()) {
      createNoteMutation.mutate({
        content: newNote.trim(),
        type: noteType
      });
    }
  };

  // Map author info to notes
  const notesWithAuthors = notes.map(note => {
    const author = users.find((u: any) => u.id === note.authorId);
    return {
      ...note,
      author: author ? { firstName: author.firstName, lastName: author.lastName } : undefined
    };
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Notes
          </CardTitle>
          {!isAddingNote && (
            <Button size="sm" variant="outline" onClick={() => setIsAddingNote(true)}>
              Add Note
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        {isAddingNote && (
          <div className="p-4 border-b bg-muted/10 space-y-3">
            <div className="flex gap-2">
              <Select
                value={noteType}
                onValueChange={(value: any) => setNoteType(value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="INTERVIEW">Interview</SelectItem>
                  <SelectItem value="REFERENCE">Reference</SelectItem>
                  <SelectItem value="INTERNAL">Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Add your note here..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNote('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={!newNote.trim() || createNoteMutation.isPending}
              >
                {createNoteMutation.isPending ? 'Adding...' : 'Save Note'}
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {isLoading ? (
              <p className="text-center text-muted-foreground text-sm">Loading notes...</p>
            ) : notesWithAuthors.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No notes yet.</p>
              </div>
            ) : (
              notesWithAuthors.map((note) => (
                <div
                  key={note.id}
                  className="group relative border rounded-lg p-3 bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`text-xs ${noteTypeConfig[note.type]?.color}`}>
                        {noteTypeConfig[note.type]?.label || note.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">
                        {note.author ? `${note.author.firstName} ${note.author.lastName}` : 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(note.createdAt), 'MMM d, h:mm a')}
                      </span>
                      {(user?.id === note.authorId || user?.role === 'SYSTEM_ADMIN' || user?.role === 'HR_ADMIN') && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteNoteMutation.mutate(note.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{note.content}</p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}