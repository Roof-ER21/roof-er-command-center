import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  Plus,
  AlertTriangle,
  Link2
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermissions';

interface Contract {
  id: number;
  employeeId: number | null;
  candidateId: number | null;
  recipientName: string;
  recipientEmail: string;
  title: string;
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'SIGNED' | 'REJECTED' | 'RESCINDED';
  sentDate?: string;
  viewedDate?: string;
  signedDate?: string;
  fileUrl?: string;
  createdAt: string;
}

interface ContractTemplate {
  id: string;
  name: string;
  type: 'EMPLOYMENT' | 'NDA' | 'CONTRACTOR' | 'OTHER' | 'RETAIL';
  territory?: string;
  content: string;
  isActive: boolean;
}

export function ContractsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin, isManager } = usePermissions();

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['/api/hr/contracts'],
    queryFn: async () => {
      const response = await fetch('/api/hr/contracts', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch contracts');
      return response.json();
    }
  });

  const { data: templates } = useQuery({
    queryKey: ['/api/hr/contract-templates'],
    queryFn: async () => {
      const response = await fetch('/api/hr/contract-templates', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
    enabled: isAdmin() || isManager()
  });

  const { data: employees } = useQuery({
    queryKey: ['/api/hr/employees'],
    queryFn: async () => {
      const response = await fetch('/api/hr/employees', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      return response.json();
    },
    enabled: isAdmin() || isManager()
  });

  const createContractMutation = useMutation({
    mutationFn: async (data: { templateId: string; employeeId: number }) => {
      const response = await fetch('/api/hr/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create contract');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/contracts'] });
      setIsDialogOpen(false);
      setSelectedTemplate('');
      setSelectedEmployee(null);
      toast({
        title: 'Success',
        description: 'Contract created successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create contract',
        variant: 'destructive'
      });
    }
  });

  const sendContractMutation = useMutation({
    mutationFn: async (contractId: string) => {
      const response = await fetch(`/api/hr/contracts/${contractId}/send`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to send contract');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/contracts'] });
      toast({
        title: 'Success',
        description: 'Contract sent successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to send contract',
        variant: 'destructive'
      });
    }
  });

  const createShareLinkMutation = useMutation({
    mutationFn: async (contractId: number) => {
      const response = await fetch(`/api/hr/contracts/${contractId}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || 'Failed to create share link');
      }
      return response.json();
    },
    onSuccess: (data) => {
      const link = `${window.location.origin}/public/contract/${data.token}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(link).catch(() => undefined);
      }
      toast({
        title: 'Link generated',
        description: 'Contract link copied to clipboard.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create share link',
        variant: 'destructive'
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'SENT': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'VIEWED': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'SIGNED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'RESCINDED': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <FileText className="w-4 h-4" />;
      case 'SENT': return <Send className="w-4 h-4" />;
      case 'VIEWED': return <Eye className="w-4 h-4" />;
      case 'SIGNED': return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED': return <XCircle className="w-4 h-4" />;
      case 'RESCINDED': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleCreateContract = () => {
    if (selectedTemplate && selectedEmployee) {
      createContractMutation.mutate({
        templateId: selectedTemplate,
        employeeId: selectedEmployee
      });
    }
  };

  const handleSendContract = (contractId: number) => {
    sendContractMutation.mutate(String(contractId));
  };

  const handleShareLink = (contractId: number) => {
    createShareLinkMutation.mutate(contractId);
  };

  // Group contracts by status
  const draftContracts = contracts?.filter((c: Contract) => c.status === 'DRAFT') || [];
  const sentContracts = contracts?.filter((c: Contract) => c.status === 'SENT' || c.status === 'VIEWED') || [];
  const signedContracts = contracts?.filter((c: Contract) => c.status === 'SIGNED') || [];
  const rejectedContracts = contracts?.filter((c: Contract) => c.status === 'REJECTED' || c.status === 'RESCINDED') || [];

  // Check for expiring contracts (sent >30 days ago)
  const expiringContracts = sentContracts.filter((c: Contract) => {
    if (!c.sentDate) return false;
    const daysSent = Math.floor((Date.now() - new Date(c.sentDate).getTime()) / (1000 * 60 * 60 * 24));
    return daysSent > 30;
  });

  if (isLoading) {
    return <div className="p-8">Loading contracts...</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Contracts</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage employee contracts and signatures
          </p>
        </div>
        {(isAdmin() || isManager()) && (
          <div className="mt-4 sm:mt-0">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Contract
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Contract</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="template">Contract Template</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates?.filter((t: ContractTemplate) => t.isActive).map((template: ContractTemplate) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name} ({template.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="employee">Select Employee</Label>
                    <Select value={selectedEmployee?.toString()} onValueChange={(value) => setSelectedEmployee(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees?.map((emp: any) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.firstName} {emp.lastName} - {emp.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateContract}
                      disabled={!selectedTemplate || !selectedEmployee || createContractMutation.isPending}
                    >
                      {createContractMutation.isPending ? 'Creating...' : 'Create Contract'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="w-6 h-6 text-gray-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Drafts
                  </dt>
                  <dd className="text-2xl font-semibold text-foreground">
                    {draftContracts.length}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Send className="w-6 h-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Awaiting Signature
                  </dt>
                  <dd className="text-2xl font-semibold text-foreground">
                    {sentContracts.length}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Signed
                  </dt>
                  <dd className="text-2xl font-semibold text-foreground">
                    {signedContracts.length}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Expiring Soon
                  </dt>
                  <dd className="text-2xl font-semibold text-foreground">
                    {expiringContracts.length}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contracts Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Contracts</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="signed">Signed</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Contracts ({contracts?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Recipient</th>
                      <th className="text-left py-3 px-4">Title</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Created</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts?.map((contract: Contract) => (
                      <tr key={contract.id} className="border-b dark:border-gray-700 hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-foreground">{contract.recipientName}</div>
                            <div className="text-sm text-muted-foreground">{contract.recipientEmail}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{contract.title}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(contract.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(contract.status)}
                              {contract.status}
                            </span>
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {new Date(contract.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            {contract.status === 'DRAFT' && (isAdmin() || isManager()) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSendContract(contract.id)}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            )}
                            {(isAdmin() || isManager()) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShareLink(contract.id)}
                              >
                                <Link2 className="w-4 h-4" />
                              </Button>
                            )}
                            {contract.fileUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(contract.fileUrl, '_blank')}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Draft Contracts ({draftContracts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {draftContracts.length > 0 ? (
                <div className="space-y-4">
                  {draftContracts.map((contract: Contract) => (
                    <div key={contract.id} className="p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-foreground">{contract.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            For: {contract.recipientName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(contract.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {(isAdmin() || isManager()) && (
                          <Button
                            size="sm"
                            onClick={() => handleSendContract(contract.id)}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Send
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No draft contracts</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Signatures ({sentContracts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {sentContracts.length > 0 ? (
                <div className="space-y-4">
                  {sentContracts.map((contract: Contract) => (
                    <div key={contract.id} className="p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-foreground">{contract.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Sent to: {contract.recipientName}
                          </p>
                          <div className="flex gap-4 mt-2">
                            {contract.sentDate && (
                              <p className="text-xs text-muted-foreground">
                                Sent: {new Date(contract.sentDate).toLocaleDateString()}
                              </p>
                            )}
                            {contract.viewedDate && (
                              <p className="text-xs text-blue-600 dark:text-blue-400">
                                Viewed: {new Date(contract.viewedDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge className={getStatusColor(contract.status)}>
                          {contract.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No pending contracts</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Signed Contracts ({signedContracts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {signedContracts.length > 0 ? (
                <div className="space-y-4">
                  {signedContracts.map((contract: Contract) => (
                    <div key={contract.id} className="p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-foreground">{contract.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Signed by: {contract.recipientName}
                          </p>
                          {contract.signedDate && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              Signed: {new Date(contract.signedDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(contract.status)}>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            SIGNED
                          </Badge>
                          {contract.fileUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(contract.fileUrl, '_blank')}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No signed contracts</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract Templates ({templates?.filter((t: ContractTemplate) => t.isActive).length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {templates?.filter((t: ContractTemplate) => t.isActive).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.filter((t: ContractTemplate) => t.isActive).map((template: ContractTemplate) => (
                    <div key={template.id} className="p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-foreground">{template.name}</h4>
                          <Badge variant="outline" className="mt-2">
                            {template.type}
                          </Badge>
                          {template.territory && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Territory: {template.territory}
                            </p>
                          )}
                        </div>
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No active templates</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
