import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Link, useLocation } from 'wouter';
import { format } from 'date-fns';
import { FileText, Plus, Search, CheckCircle2, Clock, FileEdit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useListSessions, useCreateSession, getListSessionsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

export default function Dashboard() {
  const { data: sessions, isLoading } = useListSessions();
  const createSession = useCreateSession();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newContractType, setNewContractType] = useState<string>('employment_contract');
  const [newEmployeeName, setNewEmployeeName] = useState('');

  const handleCreateSession = () => {
    if (!newEmployeeName.trim()) return;
    
    createSession.mutate(
      {
        data: {
          contractType: newContractType as any,
          employeeName: newEmployeeName,
        }
      },
      {
        onSuccess: (session) => {
          setIsCreateModalOpen(false);
          setNewEmployeeName('');
          queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
          setLocation(`/session/${session.shareToken}`);
        }
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Signed</Badge>;
      case 'pending_signature':
        return <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-amber-500/20"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      default:
        return <Badge className="bg-slate-500/10 text-slate-700 hover:bg-slate-500/20 border-slate-500/20"><FileEdit className="w-3 h-3 mr-1" /> Draft</Badge>;
    }
  };

  const getContractTypeLabel = (type: string) => {
    return type === 'employment_contract' ? 'Employment Contract' : 'Formal Offer';
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-lg tracking-tight">
            <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center">
              D
            </div>
            Dunwell Youth Priority Clinic
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary hover:bg-primary/90 text-white shadow-sm" data-testid="button-new-contract">
            <Plus className="w-4 h-4 mr-2" />
            New Contract
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-serif">Contract Management</h1>
              <p className="text-slate-500 text-sm mt-1">Generate and manage employee contracts and formal offers.</p>
            </div>
            
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search employees..." className="pl-9 bg-white" />
            </div>
          </div>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                Loading sessions...
              </div>
            ) : sessions?.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No contracts yet</h3>
                <p className="text-slate-500 max-w-sm mb-6">Create your first employment contract or formal offer to get started.</p>
                <Button onClick={() => setIsCreateModalOpen(true)} variant="outline" className="border-slate-300">
                  Create Contract
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Employee Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(session => (
                      <TableRow key={session.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium text-slate-900">{session.employeeName || 'Unnamed'}</TableCell>
                        <TableCell className="text-slate-500">{getContractTypeLabel(session.contractType)}</TableCell>
                        <TableCell>{getStatusBadge(session.status)}</TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {format(new Date(session.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/session/${session.shareToken}`}>
                            <Button variant="ghost" size="sm" className="font-medium hover:text-primary hover:bg-primary/5" data-testid={`button-open-${session.id}`}>
                              Open Workspace
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>
      </main>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Create New Contract</DialogTitle>
            <DialogDescription>
              Initialize a new contract workspace. You'll be able to fill in the details on the next screen.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="contractType">Contract Type</Label>
              <Select value={newContractType} onValueChange={setNewContractType}>
                <SelectTrigger id="contractType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employment_contract">Employment Contract</SelectItem>
                  <SelectItem value="formal_offer">Formal Offer of Employment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="employeeName">Employee Full Name</Label>
              <Input 
                id="employeeName" 
                value={newEmployeeName}
                onChange={e => setNewEmployeeName(e.target.value)}
                placeholder="e.g. Jane Doe"
                data-testid="input-new-employee-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSession} disabled={!newEmployeeName.trim() || createSession.isPending} className="bg-primary hover:bg-primary/90 text-white">
              {createSession.isPending ? 'Creating...' : 'Create Workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
