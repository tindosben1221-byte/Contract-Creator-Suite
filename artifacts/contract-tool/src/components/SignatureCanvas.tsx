import React, { useRef, useEffect, useState } from 'react';
import SignaturePad from 'signature_pad';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    if (canvasRef.current && !existingSignature) {
      const signaturePad = new SignaturePad(canvasRef.current, {
        penColor: '#2C3E50',
        backgroundColor: 'rgba(255, 255, 255, 0)',
      });
      
      // Handle high DPI screens
      const canvas = canvasRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      
      const resizeCanvas = () => {
        if (!canvas) return;
        const data = signaturePad.toData();
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d")?.scale(ratio, ratio);
        signaturePad.clear();
        signaturePad.fromData(data);
      };
      
      window.addEventListener("resize", resizeCanvas);
      resizeCanvas();
      
      setPad(signaturePad);
      
      return () => window.removeEventListener("resize", resizeCanvas);
    }
  }, [existingSignature]);

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

  if (existingSignature) {
    return (
      <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm flex flex-col items-center">
        <h4 className="font-semibold text-slate-700 text-sm mb-3 self-start">{label}</h4>
        <div className="h-32 w-full border-b border-slate-200 border-dashed mb-3 flex items-center justify-center bg-slate-50/50 relative">
          <img src={existingSignature} alt={`${label} signature`} className="max-h-full max-w-full object-contain" />
        </div>
        <div className="w-full text-xs text-slate-500 space-y-1">
          {requireName && existingDate && (
            <p className="font-medium text-slate-800">{signerName}</p>
          )}
          <p>Signed on {new Date(existingDate || '').toLocaleString()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm flex flex-col gap-3 transition-colors hover:border-slate-300">
      <h4 className="font-semibold text-slate-700 text-sm">{label}</h4>
      
      {requireName && (
        <div className="space-y-1">
          <Label className="text-xs">Signer Name</Label>
          <Input 
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Print name..."
            className="h-8 text-sm"
          />
        </div>
      )}
      
      <div className="relative border border-slate-200 bg-slate-50 rounded group">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <span className="text-2xl font-serif text-slate-900 tracking-widest select-none">Sign Here</span>
        </div>
        <canvas 
          ref={canvasRef} 
          className="w-full h-32 cursor-crosshair rounded"
          style={{ touchAction: 'none' }}
        />
      </div>
      
      <div className="flex justify-between items-center mt-1">
        <Button variant="ghost" size="sm" onClick={handleClear} className="text-slate-500 h-8 text-xs">
          Clear
        </Button>
        <Button onClick={handleSign} size="sm" className="bg-primary text-white hover:bg-primary/90 h-8 text-xs px-6" disabled={requireName && !nameInput.trim()}>
          Sign
        </Button>
      </div>
    </div>
  );
}
