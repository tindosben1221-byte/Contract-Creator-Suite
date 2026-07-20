import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'wouter';
import { useGetSession, useUpdateSession, useSaveSignature, getGetSessionQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SignatureCanvas } from '@/components/SignatureCanvas';
import { PdfGenerator } from '@/components/PdfGenerator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle2, Copy, ArrowLeft, PenTool, Link as LinkIcon, Save, Clock
} from 'lucide-react';
import { Link } from 'wouter';

export default function SessionWorkspace() {
  const params = useParams();
  const token = params.token!;
  const { data: session, isLoading, error } = useGetSession(token);
  const updateSession = useUpdateSession();
  const saveSignature = useSaveSignature();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [copySuccess, setCopySuccess] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeAddress: '',
    letterDate: '',
    position: '',
    startDate: '',
    annualSalary: '',
    monthlySalary: '',
    supervisor: '',
    employmentStatus: '',
    placeOfWork: ''
  });

  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const lastSavedData = useRef(formData);
  const initializedForId = useRef<string | null>(null);

  useEffect(() => {
    if (session && initializedForId.current !== session.id) {
      initializedForId.current = session.id;
      const initialData = {
        employeeName: session.employeeName || '',
        employeeAddress: session.employeeAddress || '',
        letterDate: session.letterDate || '',
        position: session.position || '',
        startDate: session.startDate || '',
        annualSalary: session.annualSalary || '',
        monthlySalary: session.monthlySalary || '',
        supervisor: session.supervisor || '',
        employmentStatus: session.employmentStatus || '',
        placeOfWork: session.placeOfWork || ''
      };
      setFormData(initialData);
      lastSavedData.current = initialData;
    }
  }, [session]);

  const mutateRef = useRef(updateSession.mutate);
  mutateRef.current = updateSession.mutate;

  const handleBlur = (field: string) => {
    if (!session) return;
    
    const currentValue = formData[field as keyof typeof formData];
    const lastValue = lastSavedData.current[field as keyof typeof formData];

    if (currentValue !== lastValue) {
      setSavingState('saving');
      mutateRef.current(
        {
          id: token,
          data: { [field]: currentValue }
        },
        {
          onSuccess: (updatedData) => {
            lastSavedData.current = { ...lastSavedData.current, [field]: currentValue };
            setSavingState('saved');
            // Patch local cache instead of full invalidation to prevent UX stutter
            queryClient.setQueryData(getGetSessionQueryKey(token), (old: any) => 
              old ? { ...old, [field]: currentValue } : old
            );
            setTimeout(() => setSavingState('idle'), 2000);
          }
        }
      );
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Auto-trigger blur equivalent for selects
    setSavingState('saving');
    mutateRef.current(
      {
        id: token,
        data: { [name]: value }
      },
      {
        onSuccess: () => {
          lastSavedData.current = { ...lastSavedData.current, [name]: value };
          setSavingState('saved');
          queryClient.setQueryData(getGetSessionQueryKey(token), (old: any) => 
            old ? { ...old, [name]: value } : old
          );
          setTimeout(() => setSavingState('idle'), 2000);
        }
      }
    );
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    toast({
      title: "Link Copied",
      description: "Share link has been copied to your clipboard.",
    });
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const onSign = (role: string) => (signatureData: string, signerName?: string) => {
    saveSignature.mutate(
      {
        id: token,
        data: {
          role: role as any,
          signatureData,
          signedAt: new Date().toISOString(),
          signerName
        }
      },
      {
        onSuccess: (updatedSession) => {
          toast({
            title: "Signature Saved",
            description: "The contract has been securely updated.",
          });
          queryClient.setQueryData(getGetSessionQueryKey(token), updatedSession);
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-medium">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Workspace Not Found</h2>
          <p className="text-slate-500 mb-6">The contract link you followed is invalid or has expired.</p>
          <Link href="/">
            <Button className="w-full">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isEmploymentContract = session.contractType === 'employment_contract';
  const allSigned = session.status === 'signed';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="font-bold text-slate-900 leading-tight">
                {isEmploymentContract ? 'Employment Contract' : 'Formal Offer'}
              </h1>
              <p className="text-xs text-slate-500">{session.employeeName || 'Unnamed Employee'}</p>
            </div>
            {session.status === 'signed' ? (
              <Badge className="ml-2 bg-emerald-500/10 text-emerald-700 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Fully Signed</Badge>
            ) : session.status === 'pending_signature' ? (
              <Badge className="ml-2 bg-amber-500/10 text-amber-700 border-none"><Clock className="w-3 h-3 mr-1" /> Pending Signatures</Badge>
            ) : (
              <Badge className="ml-2 bg-slate-100 text-slate-600 border-none"><PenTool className="w-3 h-3 mr-1" /> Draft</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center text-xs font-medium px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200">
              {savingState === 'saving' ? (
                <span className="text-amber-600 flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"/> Saving...</span>
              ) : savingState === 'saved' ? (
                <span className="text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3"/> Saved</span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1.5"><Save className="w-3 h-3"/> All saved</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Form Details */}
        <div className="flex-1 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center rounded-t-xl">
              <h2 className="text-lg font-bold text-slate-900 font-serif">Contract Details</h2>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="employeeName">Employee Full Name</Label>
                <Input 
                  id="employeeName" 
                  name="employeeName"
                  value={formData.employeeName} 
                  onChange={handleChange}
                  onBlur={() => handleBlur('employeeName')}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-primary"
                />
              </div>
              
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="employeeAddress">Employee Address</Label>
                <textarea 
                  id="employeeAddress" 
                  name="employeeAddress"
                  value={formData.employeeAddress} 
                  onChange={(e: any) => handleChange(e)}
                  onBlur={() => handleBlur('employeeAddress')}
                  className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="letterDate">Letter Date</Label>
                <Input 
                  id="letterDate" 
                  name="letterDate"
                  type="date"
                  value={formData.letterDate} 
                  onChange={handleChange}
                  onBlur={() => handleBlur('letterDate')}
                  className="bg-slate-50 border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input 
                  id="startDate" 
                  name="startDate"
                  type="date"
                  value={formData.startDate} 
                  onChange={handleChange}
                  onBlur={() => handleBlur('startDate')}
                  className="bg-slate-50 border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position / Job Title</Label>
                <Input 
                  id="position" 
                  name="position"
                  value={formData.position} 
                  onChange={handleChange}
                  onBlur={() => handleBlur('position')}
                  className="bg-slate-50 border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employmentStatus">Employment Status</Label>
                <Select value={formData.employmentStatus} onValueChange={(val) => handleSelectChange('employmentStatus', val)}>
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Permanent">Permanent</SelectItem>
                    <SelectItem value="Fixed Term">Fixed Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlySalary">Monthly Salary</Label>
                <Input 
                  id="monthlySalary" 
                  name="monthlySalary"
                  placeholder="e.g. R 9,500.00"
                  value={formData.monthlySalary} 
                  onChange={handleChange}
                  onBlur={() => {
                    handleBlur('monthlySalary');
                    // Auto-compute annual if empty
                    if (formData.monthlySalary && !formData.annualSalary) {
                      const numericVal = parseFloat(formData.monthlySalary.replace(/[^0-9.]/g, ''));
                      if (!isNaN(numericVal)) {
                        const annual = `R ${(numericVal * 12).toLocaleString('en-ZA', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                        setFormData(prev => ({...prev, annualSalary: annual}));
                        mutateRef.current({ id: token, data: { annualSalary: annual } });
                      }
                    }
                  }}
                  className="bg-slate-50 border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualSalary">Annual Salary</Label>
                <Input 
                  id="annualSalary" 
                  name="annualSalary"
                  placeholder="e.g. R 114,000.00"
                  value={formData.annualSalary} 
                  onChange={handleChange}
                  onBlur={() => handleBlur('annualSalary')}
                  className="bg-slate-50 border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supervisor">Immediate Supervisor</Label>
                <Input 
                  id="supervisor" 
                  name="supervisor"
                  value={formData.supervisor} 
                  onChange={handleChange}
                  onBlur={() => handleBlur('supervisor')}
                  className="bg-slate-50 border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="placeOfWork">Place of Work</Label>
                <Input 
                  id="placeOfWork" 
                  name="placeOfWork"
                  value={formData.placeOfWork} 
                  onChange={handleChange}
                  onBlur={() => handleBlur('placeOfWork')}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Sharing & Signatures */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
          
          {/* Share Block */}
          <Card className="border-primary/20 shadow-sm bg-primary/5">
            <div className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <LinkIcon className="w-4 h-4" />
                <h3>Share for Signatures</h3>
              </div>
              <p className="text-sm text-slate-600">
                Anyone with this link can view and sign the contract.
              </p>
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={window.location.href} 
                  className="bg-white border-primary/20 text-xs text-slate-600 focus-visible:ring-primary/30"
                />
                <Button 
                  onClick={handleCopyLink} 
                  size="icon" 
                  variant="outline"
                  className={copySuccess ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-white"}
                >
                  {copySuccess ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </Card>

          {/* Signatures Block */}
          <Card className="border-slate-200 shadow-sm flex-1 flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900 font-serif">Signatures</h2>
              <p className="text-xs text-slate-500 mt-1">Please sign within the boxes below.</p>
            </div>
            
            <div className="p-5 flex-1 space-y-6 overflow-y-auto">
              {isEmploymentContract ? (
                <>
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Employee & Witness</h3>
                    <SignatureCanvas 
                      label="Employee Signature" 
                      role="employee"
                      onSign={onSign('employee')}
                      existingSignature={session.employeeSignature}
                      existingDate={session.employeeSignedAt}
                    />
                    <SignatureCanvas 
                      label="Witness Signature" 
                      role="witness"
                      requireName={true}
                      signerName={session.witnessName}
                      onSign={onSign('witness')}
                      existingSignature={session.witnessSignature}
                      existingDate={session.witnessSignedAt}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Internal Approval</h3>
                    <SignatureCanvas 
                      label="Project Manager (Recommended by)" 
                      role="project_manager"
                      onSign={onSign('project_manager')}
                      existingSignature={session.projectManagerSignature}
                      existingDate={session.projectManagerSignedAt}
                    />
                    <SignatureCanvas 
                      label="Director (Approved by)" 
                      role="director"
                      onSign={onSign('director')}
                      existingSignature={session.directorSignature}
                      existingDate={session.directorSignedAt}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Employee Acceptance</h3>
                    <SignatureCanvas 
                      label="Employee Signature (Acceptance of Offer)" 
                      role="employee"
                      onSign={onSign('employee')}
                      existingSignature={session.employeeSignature}
                      existingDate={session.employeeSignedAt}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Company Approval</h3>
                    <SignatureCanvas 
                      label="Company / DEHW" 
                      role="company"
                      onSign={onSign('company')}
                      existingSignature={session.companySignature}
                      existingDate={session.companySignedAt}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 mt-auto">
              <PdfGenerator session={session} />
            </div>
          </Card>

        </div>
      </main>
    </div>
  );
}
