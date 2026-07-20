import React, { useRef, useEffect, useState } from 'react';
import SignaturePad from 'signature_pad';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

interface SignatureCanvasProps {
  label: string;
  role: string;
  onSign: (dataUrl: string, name?: string) => void;
  existingSignature?: string | null;
  existingDate?: string | null;
  requireName?: boolean;
  signerName?: string | null;
}

export function SignatureCanvas({ 
  label, 
  role, 
  onSign, 
  existingSignature, 
  existingDate,
  requireName = false,
  signerName = ''
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pad, setPad] = useState<SignaturePad | null>(null);
  const [nameInput, setNameInput] = useState(signerName || '');
  const [isSigned, setIsSigned] = useState(!!existingSignature);

  useEffect(() => {
    setIsSigned(!!existingSignature);
  }, [existingSignature]);

  useEffect(() => {
    if (canvasRef.current && !isSigned) {
      const signaturePad = new SignaturePad(canvasRef.current, {
        penColor: '#2C3E50',
        backgroundColor: 'rgba(255, 255, 255, 0)',
      });
      
      const canvas = canvasRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      
      const resizeCanvas = () => {
        if (!canvas) return;
        const data = signaturePad.toData();
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d")?.scale(ratio, ratio);
        signaturePad.clear();
        if (data && data.length > 0) {
          signaturePad.fromData(data);
        }
      };
      
      window.addEventListener("resize", resizeCanvas);
      resizeCanvas();
      
      setPad(signaturePad);
      
      return () => window.removeEventListener("resize", resizeCanvas);
    }
  }, [isSigned]);

  const handleClear = () => {
    if (pad) pad.clear();
  };

  const handleSign = () => {
    if (pad && !pad.isEmpty()) {
      if (requireName && !nameInput.trim()) {
        alert("Please enter a name");
        return;
      }
      const dataUrl = pad.toDataURL('image/png');
      onSign(dataUrl, requireName ? nameInput : undefined);
      setIsSigned(true);
    }
  };

  const handleResign = () => {
    setIsSigned(false);
  };

  if (isSigned && existingSignature) {
    const formattedDate = existingDate ? format(new Date(existingDate), "dd MMM yyyy, HH:mm") : '';

    return (
      <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm flex flex-col items-center group relative overflow-hidden transition-all hover:border-slate-300">
        <h4 className="font-semibold text-slate-700 text-sm mb-3 self-start">{label}</h4>
        <div className="w-full flex justify-center mb-3 border-b border-slate-100 pb-2">
          <img src={existingSignature} alt={`${label} signature`} className="w-full object-contain max-h-24 mix-blend-multiply" />
        </div>
        <div className="w-full flex flex-col items-center text-xs text-slate-500 space-y-1">
          {requireName && existingDate && (
            <p className="font-medium text-slate-800">{signerName}</p>
          )}
          <div className="flex items-center text-primary font-medium">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            <span>Signed: {formattedDate}</span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleResign} 
          className="absolute top-2 right-2 h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Re-sign
        </Button>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm flex flex-col gap-3 transition-colors hover:border-primary/50">
      <h4 className="font-semibold text-slate-700 text-sm">{label}</h4>
      
      {requireName && (
        <div className="space-y-1">
          <Label className="text-xs">Signer Name</Label>
          <Input 
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Print name..."
            className="h-8 text-sm focus-visible:ring-primary"
          />
        </div>
      )}
      
      <div className="relative border-2 border-dashed border-[#0ABFBC]/40 hover:border-[#0ABFBC] transition-colors bg-slate-50/50 rounded-md group overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <span className="text-3xl font-serif text-slate-800 select-none">Sign here</span>
        </div>
        <canvas 
          ref={canvasRef} 
          className="w-full h-36 cursor-crosshair rounded-md relative z-10"
          style={{ touchAction: 'none' }}
        />
      </div>
      
      <div className="flex justify-between items-center mt-1">
        <Button variant="ghost" size="sm" onClick={handleClear} className="text-slate-500 h-8 text-xs hover:bg-slate-100">
          Clear
        </Button>
        <Button onClick={handleSign} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs px-6" disabled={requireName && !nameInput.trim()}>
          Sign
        </Button>
      </div>
    </div>
  );
}
