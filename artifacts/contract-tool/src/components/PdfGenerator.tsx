import React from 'react';
import jsPDF from 'jspdf';
import { Session } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import logoUrl from '@assets/Logo_Registered_.jpg_1784563137893.jpeg';

interface PdfGeneratorProps {
  session: Session;
  type: 'employment_contract' | 'formal_offer';
}

export function PdfGenerator({ session, type }: PdfGeneratorProps) {
  const isEmploymentContract = type === 'employment_contract';

  const generatePdf = async () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 20;
    const margin = 20;

    const safeValue = (val: string | null | undefined) => val || '____________________';

    const checkPageBreak = (neededSpace: number) => {
      if (currentY + neededSpace > pageHeight - margin - 15) { // 15 for footer
        addFooter();
        doc.addPage();
        currentY = margin;
        addHeader();
      }
    };

    let pageNum = 1;
    const addFooter = () => {
      const startY = pageHeight - 15;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, startY, pageWidth - margin, startY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('DUNWELL YOUTH PRIORITY CLINIC — CONFIDENTIAL', pageWidth / 2, startY + 5, { align: 'center' });
      doc.text(`Page ${pageNum}`, pageWidth - margin, startY + 5, { align: 'right' });
      pageNum++;
      doc.setTextColor(0, 0, 0); // reset
    };

    let logoBase64: string | null = null;
    
    try {
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      logoBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error("Failed to load image", e);
    }

    const addHeader = () => {
      if (logoBase64) {
        doc.addImage(logoBase64, 'JPEG', margin, currentY, 28, 28);
      }
      
      const headerX = margin + 33;
      doc.setTextColor(43, 62, 80); // Dark slate (#2b3e50 approx)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('DUNWELL YOUTH PRIORITY CLINIC', headerX, currentY + 10);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128); // Grey
      doc.text('Executive Healthcare and Wellness', headerX, currentY + 15);
      doc.text('Johannesburg, South Africa', headerX, currentY + 20);
      
      currentY += 32;
      
      // Teal line
      doc.setDrawColor(10, 191, 188); // #0ABFBC
      doc.setLineWidth(0.8 * 0.3527); // 0.8pt to mm
      doc.line(margin, currentY, pageWidth - margin, currentY);
      
      currentY += 8;
      doc.setTextColor(43, 62, 80); // Reset body text to dark slate
    };

    const addText = (text: string, size: number, isBold: boolean, align: 'left' | 'center' | 'right' = 'left', yOffset = 0, indent = 0) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(size);
      
      let x = margin + indent;
      if (align === 'center') {
        const textWidth = doc.getStringUnitWidth(text) * size / doc.internal.scaleFactor;
        x = (pageWidth - textWidth) / 2;
      }
      if (align === 'right') {
        const textWidth = doc.getStringUnitWidth(text) * size / doc.internal.scaleFactor;
        x = pageWidth - margin - textWidth;
      }
      
      doc.text(text, x, currentY + yOffset);
      currentY += size * 0.5 + yOffset;
    };

    const addWrappedText = (text: string, size: number, isBold: boolean, maxWidth = pageWidth - margin * 2, indent = 0) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(size);
      
      const lines = doc.splitTextToSize(text, maxWidth - indent);
      doc.text(lines, margin + indent, currentY);
      currentY += lines.length * 5; // 5mm leading
    };

    const addSectionHeader = (text: string) => {
      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(10, 191, 188); // Teal
      doc.text(text.toUpperCase(), margin, currentY);
      currentY += 2;
      
      doc.setDrawColor(10, 191, 188);
      doc.setLineWidth(0.2);
      const textWidth = doc.getStringUnitWidth(text.toUpperCase()) * 10 / doc.internal.scaleFactor;
      doc.line(margin, currentY, margin + textWidth, currentY);
      
      currentY += 3;
      doc.setTextColor(43, 62, 80); // Reset text color
    };

    const addSignatureBlock = (label: string, sigBase64: string | null | undefined, sigDate: string | null | undefined, signerName: string | null | undefined, x: number, w: number = 45) => {
      const topY = currentY;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(label, x, topY);
      
      const lineY = topY + 15;
      
      if (sigBase64) {
        try {
          doc.addImage(sigBase64, 'PNG', x, topY + 2, w, 18);
        } catch (e) {}
      }
      
      doc.setDrawColor(150, 150, 150);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(x, lineY, x + w, lineY);
      doc.setLineDashPattern([], 0); // reset
      
      let curLineY = lineY + 5;
      
      if (signerName) {
        doc.setFont('helvetica', 'normal');
        doc.text(`Name: ${signerName}`, x, curLineY);
        curLineY += 5;
      }
      
      doc.setFont('helvetica', 'normal');
      if (sigDate) {
        const formatted = format(new Date(sigDate), "dd MMM yyyy, HH:mm");
        doc.text(`Date: ${formatted}`, x, curLineY);
      } else {
        doc.text(`Date: ___________`, x, curLineY);
      }
    };

    // First page header
    addHeader();

    if (isEmploymentContract) {
      addText('EMPLOYMENT CONTRACT', 13, true, 'center');
      currentY += 8;

      addText(safeValue(session.employeeName), 11, true);
      addWrappedText(safeValue(session.employeeAddress), 9.5, false);
      currentY += 3;
      
      addText(safeValue(session.letterDate), 9.5, false);
      currentY += 8;

      addText(`Dear ${safeValue(session.employeeName)},`, 9.5, false);
      currentY += 4;

      const introText = `We have pleasure in confirming our offer of ${safeValue(session.employmentStatus)} employment with DUNWELL EXECUTIVE HEALTHCARE AND WELLNESS (herein referred to as "DEHW") in the position of ${safeValue(session.position)}, commencing on ${safeValue(session.startDate)}. This position is ${safeValue(session.employmentStatus)} and ongoing, subject to the terms and conditions outlined in this employment contract. This contract is subject to a favourable report on verification of your Personal Credentials.`;
      
      addWrappedText(introText, 9.5, false);
      currentY += 4;

      addText("The terms and conditions of such employment are set out below:", 9.5, false);
      currentY += 2;
      addWrappedText(`•  You will be reporting to the ${safeValue(session.supervisor)}`, 9.5, false, undefined, 5);
      addWrappedText(`•  You will have no expectation, nor does the employer create any expectation that your contract would be extended past the above-mentioned fixed period. No additional discharge benefits, severance and/or related payments will be due on termination.`, 9.5, false, undefined, 5);
      addWrappedText(`•  You shall be bound by the terms and conditions of service as stated in the DEHW Program Policy & Procedure Manual and the Employee handbook (hereafter referred to as "the Manual") which serves as the official policy documents setting out the rules and regulations.`, 9.5, false, undefined, 5);
      currentY += 4;

      addSectionHeader("ARTICLE 1: JOB DESCRIPTION AND EMPLOYMENT DUTIES");
      addWrappedText(`Your roles and responsibilities are outlined in your job description. Your job description will be fully discussed with you by the ${safeValue(session.supervisor)} to whom you report. Please feel free to seek clarification pertaining to your role and responsibilities during that time. You undertake to:`, 9.5, false);
      addWrappedText(`•  Carry out all such functions and duties as are, from time to time, assigned to you and as are reasonable or lawful, including those set out in your job description;`, 9.5, false, undefined, 5);
      addWrappedText(`•  Obey and comply with all lawful and reasonable instructions given to you by your superior;`, 9.5, false, undefined, 5);
      addWrappedText(`•  Be loyal to DEHW in all dealings and transactions relating to the business and interests of DEHW and to use your best abilities to protect and promote the business, reputation and goodwill of DEHW;`, 9.5, false, undefined, 5);
      addWrappedText(`•  Submit to the management, or to any person nominated by management, such information and reports as may be required of you in connection with the performance of your duties and the business of DEHW;`, 9.5, false, undefined, 5);
      addWrappedText(`•  Devote the whole of your time and attention during DEHW working hours, and such additional time as the exigencies of DEHW business may require, to the business affairs of DEHW and to your duties in terms of your employment with DEHW.`, 9.5, false, undefined, 5);
      currentY += 4;

      addSectionHeader("ARTICLE 2: REMUNERATION");
      addWrappedText(`Your remuneration shall consist of a gross consolidated salary of\n${safeValue(session.annualSalary)} per annum; or\n${safeValue(session.monthlySalary)} per month.`, 9.5, false);
      addWrappedText(`Any and all wages earned are subject to statutory deductions, as required by the government and/or any other amounts owing to DEHW for any reason. The deductions will be reflected on your pay slip. Your remuneration shall be paid by the LAST DAY of every month, but not later than the 1st of the month into your personal bank account, which particulars should be provided to and verified with our Finance department.`, 9.5, false);
      currentY += 4;

      checkPageBreak(30);
      addSectionHeader("ARTICLE 3: OTHER BENEFITS");
      addWrappedText(`DEHW reserves the right to offer additional benefits, both company paid, and employee paid or both. Should any employee elect said benefits, the employee thereby agrees to any deductions required to cover the employee contribution and to abide by the terms and conditions of the program, plan, or scheme. The employee shall understand that some benefits may require election within a specified period of time and failure to comply with deadlines may forfeit the ability to elect such benefits at a later date.`, 9.5, false);
      currentY += 4;

      addSectionHeader("ARTICLE 4: HOURS OF WORK");
      addWrappedText(`Your ordinary hours of work shall be from 09:00 to 17:00, Monday to Friday, 09:00 to 13:00 Sat & PH. However, DEHW reserves the right to have the employee work for 45 hours weekly if deemed necessary per the terms of the Basic Conditions Employment Act (BCEA). Employees are entitled to a 1hr meal interval for each day worked.`, 9.5, false);
      addWrappedText(`You agree to work overtime, in addition to a 45-hour workweek, as may be necessary for DEHW's business. You will be compensated for any overtime in accordance to legal requirements, specifically the Basic Conditions Employment Act (BCEA).`, 9.5, false);
      currentY += 4;

      checkPageBreak(30);
      addSectionHeader("ARTICLE 5: PERIOD OF PROBATION");
      addWrappedText(`For all new employees, your appointment is subject to a three (3) month probation period. During this probation period parties on both sides are required to give notice according to the requirements in Article 7.`, 9.5, false);
      currentY += 4;

      addSectionHeader("ARTICLE 6: TERMINATION NOTICE");
      addWrappedText(`The parties may terminate this contract by giving written notice as follows:`, 9.5, false);
      addWrappedText(`•  1 (one) week during the first 6 (six) months of employment.`, 9.5, false, undefined, 5);
      addWrappedText(`•  2 (two) weeks if the employee has been employed for more than 6 months, but no longer than 1 year.`, 9.5, false, undefined, 5);
      addWrappedText(`•  1 calendar months' notice if employee has worked for more than 1 year or payment in lieu thereof.`, 9.5, false, undefined, 5);
      addWrappedText(`DEWH can also terminate the contract at any time, should the Employee be found in violation of policies and/or procedures.`, 9.5, false);
      currentY += 4;

      addSectionHeader("ARTICLE 7: PLACE OF WORK");
      addWrappedText(`Your place of work is situated at ${safeValue(session.placeOfWork)} if and when required, you may be called upon to attend meetings / conferences and congresses off the premises.`, 9.5, false);
      currentY += 4;

      checkPageBreak(30);
      addSectionHeader("ARTICLE 8: ANNUAL LEAVE");
      addWrappedText(`You shall be entitled to take a maximum of 21 working days leave per year. Leave shall be taken at a time, or times, convenient to DEHW, within six months of the completion of the applicable leave cycle.\nDEHW leave policy states that no more than 5 (five) days can be carried over every year to the next cycle.\nUpon termination of your employment, you shall be entitled to be paid out in respect of any accrued leave not yet taken prior to the termination of your employment.\nLeave application forms shall be submitted within a reasonable time prior to taking leave.`, 9.5, false);
      currentY += 4;

      addSectionHeader("ARTICLE 9: SICK LEAVE");
      addWrappedText(`You shall be entitled to 30 working days sick leave over a 3-year period, with 10 days paid sick leave only, in the first year of your employment. Any further paid sick leave may be given at the discretion of DEHW management only. Should you be absent for 2 consecutive days or more, or on a Monday or Friday, you will be required to produce a medical certificate or doctor's letter, in order to qualify for paid sick leave.`, 9.5, false);
      addWrappedText(`Should you, at any time, become permanently unable, in the reasonable opinion of DEHW management, to perform your duties adequately by reason of ill health, DEHW shall be entitled to terminate your employment on such terms as DEHW, in its discretion, considers reasonable.`, 9.5, false);
      currentY += 4;

      checkPageBreak(30);
      addSectionHeader("ARTICLE 10: COMPASSIONATE LEAVE");
      addWrappedText(`Up to a maximum of 3 working days per annum shall be allowed as compassionate leave for the purpose of attending to emergencies such as death or critical sickness of family members and other relations. Compassionate leave is subject to agreement with and approval of your line manager.`, 9.5, false);
      currentY += 4;

      addSectionHeader("ARTICLE 11: MATERNITY LEAVE / PATERNITY LEAVE");
      addWrappedText(`Maternity leave shall be allowed at the rate of 90 days (3 calendar months). Maternity leave may be taken from TWO weeks before the expected delivery date. DEHW will compensate the employee 50% paid maternity leave for the first three months ONLY.`, 9.5, false);
      addWrappedText(`An employee who is a parent of a child will be entitled to 10 consecutive days' parental leave. This will effectively replace the three days' paternity leave currently provided for in the BCEA. Parental leave may commence on the day the child is born.`, 9.5, false);
      currentY += 4;

      checkPageBreak(30);
      addSectionHeader("ARTICLE 12: CONFIDENTIALITY");
      addWrappedText(`You agree not to use, for your own benefit or for the benefit of any other person, and not to disclose to any third party, except in the ordinary and proper course of DEHW's business, any confidential information of DEHW; either while this agreement is in operation or after its termination.`, 9.5, false);
      currentY += 4;

      addSectionHeader("ARTICLE 13: RESTRAINTS");
      addWrappedText(`The employee undertakes and agrees that during the period of employment he/she shall not, without prior written consent from the employer, which consent shall not be unreasonably withheld:`, 9.5, false);
      addWrappedText(`•  Accept any position of employment with another employer;`, 9.5, false, undefined, 5);
      addWrappedText(`•  Incur any liability or debt or enter into any contract on behalf of the employer;`, 9.5, false, undefined, 5);
      addWrappedText(`•  Disclose or divulge or communicate to any person not authorized to receive the information, any information belonging to the employer and / or relating to the employer's affairs or the affairs of any client or business associate of the employer;`, 9.5, false, undefined, 5);
      addWrappedText(`•  The rights to any project of any nature developed during the course of employment. The employee has no claim to any benefit from such project other than, when granted by the employer in writing.`, 9.5, false, undefined, 5);
      currentY += 4;

      checkPageBreak(30);
      addSectionHeader("ARTICLE 14: DISCIPLINARY, GRIEVANCE AND RETRENCHMENT");
      addWrappedText(`You will be bound by the disciplinary, grievance, and retrenchment procedures determined and communicated by DEHW from time to time.`, 9.5, false);
      currentY += 4;

      addSectionHeader("ARTICLE 15: RETURN OF ASSETS");
      addWrappedText(`On termination of your employment, you shall immediately deliver to DEHW all assets, records, documents, accounts, letters, notes, memoranda and papers of every description within your possession or control, relating to the affairs and business of DEHW, whether or not they were originally supplied by DEHW.`, 9.5, false);
      currentY += 4;

      addSectionHeader("ARTICLE 16: GENERAL PROVISIONS");
      addWrappedText(`No indulgence granted by a party shall constitute a waiver of any of that party's rights under this agreement; accordingly, that party shall not be precluded as a consequence of having granted such indulgence, from exercising any rights against the other which may have arisen in the past or which may arise in the future.`, 9.5, false);
      addWrappedText(`•  No agreement varying, adding to, deleting from or cancelling this agreement, shall be effective unless produced to writing and signed by, or on behalf of, the parties;`, 9.5, false, undefined, 5);
      addWrappedText(`•  This agreement, subject to clause below, and as read with the disciplinary, grievance and retrenchment procedures laid down by DEHW from time to time, shall constitute the entire contract between the parties with regard to the matters dealt with in this agreement, and no representations, terms, conditions or warranties not contained in this agreement shall be binding on the parties;`, 9.5, false, undefined, 5);
      addWrappedText(`•  This agreement and the disciplinary, grievance and retrenchment procedures as laid down by DEHW from time to time, shall at all times be subject to the provisions of the Labour Relations Act, No. R66 of 1995 as amended and any other law applicable at the time, including the Basic conditions of Employment Act No. 75 of 1997.`, 9.5, false, undefined, 5);
      addWrappedText(`•  You hereby expressly give DEHW permission to intercept, monitor, access, read, block or act upon any of your electronic communications including but not limited to e-mail correspondence, computer files stored on the computer or on your network or any storage device owned by DEHW including internal telephone/telefax transmissions.`, 9.5, false, undefined, 5);
      currentY += 8;

      addText("We take pleasure in welcoming you to the DEHW team and look forward to working with you.", 9.5, false);
      currentY += 5;
      
      addText("Yours sincerely,", 9.5, false);
      currentY += 10;

      checkPageBreak(40);
      addSignatureBlock("PROJECT MANAGER", session.projectManagerSignature, session.projectManagerSignedAt, undefined, margin, 50);
      currentY += 28;
      addSignatureBlock("DIRECTOR", session.directorSignature, session.directorSignedAt, undefined, margin, 50);
      
      addFooter();
      doc.addPage();
      currentY = margin;
      addHeader();

      addText("ACCEPTANCE CLAUSE", 11, true, 'center');
      currentY += 8;
      addWrappedText(`I hereby accept and understand the conditions of employment as set out in this offer of fixed term employment. I confirm and accept that the contents of this letter have been explained to me, that the contents are fair and reasonable and agree to abide by the terms of this offer.`, 9.5, false);
      currentY += 10;
      
      addText(`Signed at ${safeValue(session.placeOfWork)} on this _______ day of ______________ 202____.`, 9.5, false);
      currentY += 15;

      const halfW = pageWidth / 2;
      addSignatureBlock("EMPLOYEE", session.employeeSignature, session.employeeSignedAt, safeValue(session.employeeName), margin, 50);
      addSignatureBlock("WITNESS", session.witnessSignature, session.witnessSignedAt, safeValue(session.witnessName), halfW, 50);

      addFooter();

    } else {
      // Formal Offer
      addText('FORMAL OFFER OF EMPLOYMENT', 13, true, 'center');
      currentY += 12;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      const startDetailsY = currentY;
      
      const detailsBlock = [
        { label: 'Employee Name:', value: safeValue(session.employeeName) },
        { label: 'Offer Date:', value: safeValue(session.letterDate) },
        { label: 'Position Title:', value: safeValue(session.position) },
        { label: 'Employment Status:', value: safeValue(session.employmentStatus) },
        { label: 'Term of Contract:', value: safeValue(session.employmentStatus) },
        { label: 'Monthly Compensation:', value: safeValue(session.monthlySalary) },
        { label: 'Effective Start Date:', value: safeValue(session.startDate) },
        { label: 'Immediate Supervisor:', value: safeValue(session.supervisor) },
      ];
      
      detailsBlock.forEach(item => {
        doc.setFont('helvetica', 'bold');
        doc.text(item.label, margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(item.value, margin + 45, currentY);
        currentY += 6;
      });
      
      currentY += 8;
      addText(`Dear ${safeValue(session.employeeName)},`, 9.5, false);
      currentY += 4;
      
      addWrappedText(`We are pleased to extend you a formal offer of employment with Dunwell Executive Healthcare and Wellness in the position of ${safeValue(session.position)} based in ${safeValue(session.placeOfWork)}.`, 9.5, false);
      currentY += 4;
      
      addText("Upon your written acceptance of this offer, the following benefits will be extended to you:", 9.5, false);
      addWrappedText(`•  Paid Annual leave of 21 days.`, 9.5, false, undefined, 5);
      addWrappedText(`•  Paid Sick leave to maximum accrual as governed by local country law.`, 9.5, false, undefined, 5);
      addWrappedText(`•  Compassionate Leave per maximum days as governed by local country law.`, 9.5, false, undefined, 5);
      currentY += 8;

      addSectionHeader("ACCEPTANCE OF OFFER");
      addWrappedText(`I agree by signing below that I understand and agree to the terms and conditions of this offer extended by (Dunwell Executive Healthcare and Wellness) and no other terms apply. I agree that (Dunwell Executive Healthcare and Wellness) has made no other promises other than what is outlined in this offer letter. Any changes in the terms of my employment, including benefits, must be authorized by the CEO & COO of the company.`, 9.5, false);
      currentY += 8;
      
      addSignatureBlock("EMPLOYEE SIGNATURE", session.employeeSignature, session.employeeSignedAt, undefined, margin, 50);
      currentY += 28;

      addSectionHeader("ACKNOWLEDGEMENT OF JOB DESCRIPTION");
      addWrappedText(`I have read the job description for the position offered to me and agree to its contents. I acknowledge that any other duties may be requested of me that are not specially stated here.`, 9.5, false);
      currentY += 8;
      
      addSignatureBlock("EMPLOYEE SIGNATURE", session.employeeSignature, session.employeeSignedAt, undefined, margin, 50);
      currentY += 28;
      
      addSectionHeader("AGREEMENT FROM DUNWELL EXECUTIVE HEALTHCARE & WELLNESS:");
      currentY += 4;
      addSignatureBlock("COMPANY SIGNATURE", session.companySignature, session.companySignedAt, undefined, margin, 50);

      addFooter();
    }

    const filenameType = isEmploymentContract ? 'Employment_Contract' : 'Formal_Offer';
    doc.save(`Dunwell_${filenameType}_${session.employeeName?.replace(/\s+/g, '_') || 'Draft'}.pdf`);
  };

  return (
    <Button 
      onClick={generatePdf} 
      variant={isEmploymentContract ? "default" : "outline"}
      className={isEmploymentContract 
        ? "w-full bg-gradient-to-r from-primary to-[#08A8A5] text-white font-semibold shadow-sm hover:shadow transition-all"
        : "w-full bg-gradient-to-r from-[#F5C518] to-[#E3B514] text-[#2b3e50] border-none font-semibold shadow-sm hover:shadow transition-all"
      }
    >
      <Download className="w-4 h-4 mr-2" />
      {isEmploymentContract ? "Download Employment Contract" : "Download Formal Offer"}
    </Button>
  );
}
