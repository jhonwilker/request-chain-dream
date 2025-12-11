import { useState } from 'react';
import { FileText, MoreVertical, Pencil, Trash2, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TestSuite } from '@/hooks/useTestSuites';
import { cn } from '@/lib/utils';

interface TestSuiteCardProps {
  suite: TestSuite;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: { name?: string; description?: string }) => void;
  onDelete: () => void;
}

export function TestSuiteCard({ suite, isSelected, onSelect, onUpdate, onDelete }: TestSuiteCardProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editName, setEditName] = useState(suite.name);
  const [editDescription, setEditDescription] = useState(suite.description || '');

  const handleSaveEdit = () => {
    onUpdate({ name: editName, description: editDescription });
    setEditDialogOpen(false);
  };

  const handleConfirmDelete = () => {
    onDelete();
    setDeleteDialogOpen(false);
  };

  const requestCount = suite.api_requests?.length || 0;

  return (
    <>
      <Card
        className={cn(
          'cursor-pointer transition-all duration-200 hover:border-primary/50',
          isSelected && 'border-primary bg-primary/5'
        )}
        onClick={onSelect}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                isSelected ? 'bg-primary/20' : 'bg-muted'
              )}>
                <FileText className={cn(
                  'h-4 w-4',
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                )} />
              </div>
              <div>
                <CardTitle className="text-base font-medium">{suite.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {requestCount} request{requestCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setEditName(suite.name);
                  setEditDescription(suite.description || '');
                  setEditDialogOpen(true);
                }}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteDialogOpen(true);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        {suite.description && (
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground line-clamp-2">{suite.description}</p>
          </CardContent>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Test Suite</DialogTitle>
            <DialogDescription>
              Update the name and description of your test suite.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Test suite name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Test Suite</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{suite.name}"? This will also delete all requests within this test suite. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}