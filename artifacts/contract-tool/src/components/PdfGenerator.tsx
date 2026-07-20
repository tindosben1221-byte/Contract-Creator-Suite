import React from 'react';
import jsPDF from 'jspdf';
import { Session } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface PdfGeneratorProps {
  session: Session;
}

export function PdfGenerator({ session }: PdfGeneratorProps) {
  const generatePdf = async () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;
    const margin = 20;

    // Helper to add text and update Y
    const addText = (text: string, size: number, isBold: boolean, align: 'left' | 'center' | 'right' = 'left', yOffset = 0, indent = 0) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(size);
      
      const textWidth = doc.getStringUnitWidth(text) * size / doc.internal.scaleFactor;
      let x = margin + indent;
      if (align === 'center') x = (pageWidth - textWidth) / 2;
      if (align === 'right') x = pageWidth - margin - textWidth;
      
      doc.text(text, x, currentY + yOffset);
      currentY += size * 0.4 + yOffset;
    };

    // Helper to add wrapped text
    const addWrappedText = (text: string, size: number, isBold: boolean, maxWidth = pageWidth - margin * 2, indent = 0) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(size);
      
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, margin + indent, currentY);
      currentY += lines.length * (size * 0.45);
    };

    // Helper to add images securely
    const addImageToBase64 = async (url: string) => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.error("Failed to load image", e);
        return null;
      }
    };

    // 1. Header with Logo
    const logoBase64 = await addImageToBase64('/attached_assets/Logo_Registered_.jpg_1784562296480.jpeg');
    if (logoBase64) {
      doc.addImage(logoBase64, 'JPEG', margin, currentY, 30, 30);
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('DUNWELL YOUTH PRIORITY CLINIC', margin + 35, currentY + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Executive Healthcare and Wellness', margin + 35, currentY + 16);
    
    currentY += 40;
    
    // Thin horizontal rule
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;
    doc.setTextColor(0, 0, 0); // Reset text color

    const safeValue = (val: string | null | undefined) => val || '____________________';

    if (session.contractType === 'employment_contract') {
      addText('EMPLOYMENT CONTRACT', 14, true, 'center');
      currentY += 10;

      addText(safeValue(session.employeeName), 11, true);
      addWrappedText(safeValue(session.employeeAddress), 11, false);
      currentY += 5;
      
      addText(safeValue(session.letterDate), 11, false);
      currentY += 10;

      addText(`Dear ${safeValue(session.employeeName)},`, 11, false);
      currentY += 5;

      const introText = `We have pleasure in confirming our offer of permanent employment with DUNWELL EXECUTIVE HEALTHCARE AND WELLNESS (herein referred to as "DEHW") in the position of ${safeValue(session.position)}, commencing on ${safeValue(session.startDate)}. This position is ${safeValue(session.employmentStatus)} and ongoing, subject to the terms and conditions outlined in this employment contract. This contract is subject to a favourable report on verification of your Personal Credentials.`;
      
      addWrappedText(introText, 10, false);
      currentY += 5;

      addText("The terms and conditions of such employment are set out below:", 10, false);
      currentY += 2;
      addWrappedText(`• You will be reporting to the ${safeValue(session.supervisor)}`, 10, false, undefined, 5);
      addWrappedText(`• You will have no expectation, nor does the employer create any expectation that your contract would be extended past the above-mentioned fixed period. No additional discharge benefits, severance and/or related payments will be due on termination.`, 10, false, undefined, 5);
      addWrappedText(`• You shall be bound by the terms and conditions of service as stated in the DEHW Program Policy & Procedure Manual and the Employee handbook (hereafter referred to as "the Manual") which serves as the official policy documents setting out the rules and regulations. All the rules pertaining to this employment relationship are contained therein and will at all relevant times apply to your position.`, 10, false, undefined, 5);
      currentY += 5;

      addText("ARTICLE 1: JOB DESCRIPTION AND EMPLOYMENT DUTIES", 11, true);
      addWrappedText(`Your roles and responsibilities are outlined in your job description. Your job description will be fully discussed with you by the ${safeValue(session.supervisor)} to whom you report. Please feel free to seek clarification pertaining to your role and responsibilities during that time. You undertake to:`, 10, false);
      addWrappedText(`• Carry out all such functions and duties as are, from time to time, assigned to you and as are reasonable or lawful, including those set out in your job description;`, 10, false, undefined, 5);
      addWrappedText(`• Obey and comply with all lawful and reasonable instructions given to you by your superior;`, 10, false, undefined, 5);
      addWrappedText(`• Be loyal to DEHW in all dealings and transactions relating to the business and interests of DEHW and to use your best abilities to protect and promote the business, reputation and goodwill of DEHW;`, 10, false, undefined, 5);
      addWrappedText(`• Submit to the management, or to any person nominated by management, such information and reports as may be required of you in connection with the performance of your duties and the business of DEHW;`, 10, false, undefined, 5);
      addWrappedText(`• Devote the whole of your time and attention during DEHW working hours, and such additional time as the exigencies of DEHW business may require, to the business affairs of DEHW and to your duties in terms of your employment with DEHW.`, 10, false, undefined, 5);
      currentY += 5;

      addText("ARTICLE 2: REMUNERATION", 11, true);
      addWrappedText(`Your remuneration shall consist of a gross consolidated salary of\n${safeValue(session.annualSalary)} per annum; or\n${safeValue(session.monthlySalary)} per month.`, 10, false);
      addWrappedText(`Any and all wages earned are subject to statutory deductions, as required by the government and/or any other amounts owing to DEHW for any reason. The deductions will be reflected on your pay slip. Your remuneration shall be paid by the LAST DAY of every month, but not later than the 1st of the month into your personal bank account, which particulars should be provided to and verified with our Finance department.`, 10, false);
      currentY += 5;

      addText("ARTICLE 3: OTHER BENEFITS", 11, true);
      addWrappedText(`DEHW reserves the right to offer additional benefits, both company paid, and employee paid or both. Should any employee elect said benefits, the employee thereby agrees to any deductions required to cover the employee contribution and to abide by the terms and conditions of the program, plan, or scheme. The employee shall understand that some benefits may require election within a specified period of time and failure to comply with deadlines may forfeit the ability to elect such benefits at a later date.`, 10, false);
      currentY += 5;

      addText("ARTICLE 4: HOURS OF WORK", 11, true);
      addWrappedText(`Your ordinary hours of work shall be from 09:00 to 17:00, Monday to Friday, 09:00 to 13:00 Sat & PH. However, DEHW reserves the right to have the employee work for 45 hours weekly if deemed necessary per the terms of the Basic Conditions Employment Act (BCEA). Employees are entitled to a 1hr meal interval for each day worked.`, 10, false);
      addWrappedText(`You agree to work overtime, in addition to a 45-hour workweek, as may be necessary for DEHW's business. You will be compensated for any overtime in accordance to legal requirements, specifically the Basic Conditions Employment Act (BCEA).`, 10, false);
      currentY += 5;

      // Add a new page here as it gets long
      doc.addPage();
      currentY = 20;

      addText("ARTICLE 5: PERIOD OF PROBATION", 11, true);
      addWrappedText(`For all new employees, your appointment is subject to a three (3) month probation period. During this probation period parties on both sides are required to give notice according to the requirements in Article 7.`, 10, false);
      currentY += 5;

      addText("ARTICLE 6: TERMINATION NOTICE", 11, true);
      addWrappedText(`The parties may terminate this contract by giving written notice as follows:`, 10, false);
      addWrappedText(`• 1 (one) week during the first 6 (six) months of employment.`, 10, false, undefined, 5);
      addWrappedText(`• 2 (two) weeks if the employee has been employed for more than 6 months, but no longer than 1 year.`, 10, false, undefined, 5);
      addWrappedText(`• 1 calendar months' notice if employee has worked for more than 1 year or payment in lieu thereof.`, 10, false, undefined, 5);
      addWrappedText(`DEWH can also terminate the contract at any time, should the Employee be found in violation of policies and/or procedures.`, 10, false);
      currentY += 5;

      addText("ARTICLE 7: PLACE OF WORK", 11, true);
      addWrappedText(`Your place of work is situated at ${safeValue(session.placeOfWork)} if and when required, you may be called upon to attend meetings / conferences and congresses off the premises.`, 10, false);
      currentY += 5;

      addText("ARTICLE 8: ANNUAL LEAVE", 11, true);
      addWrappedText(`You shall be entitled to take a maximum of 21 working days leave per year. Leave shall be taken at a time, or times, convenient to DEHW, within six months of the completion of the applicable leave cycle.\nDEHW leave policy states that no more than 5 (five) days can be carried over every year to the next cycle.\nUpon termination of your employment, you shall be entitled to be paid out in respect of any accrued leave not yet taken prior to the termination of your employment.\nLeave application forms shall be submitted within a reasonable time prior to taking leave.`, 10, false);
      currentY += 5;

      addText("ARTICLE 9: SICK LEAVE", 11, true);
      addWrappedText(`You shall be entitled to 30 working days sick leave over a 3-year period, with 10 days paid sick leave only, in the first year of your employment. Any further paid sick leave may be given at the discretion of DEHW management only. Should you be absent for 2 consecutive days or more, or on a Monday or Friday, you will be required to produce a medical certificate or doctor's letter, in order to qualify for paid sick leave.`, 10, false);
      addWrappedText(`Should you, at any time, become permanently unable, in the reasonable opinion of DEHW management, to perform your duties adequately by reason of ill health, DEHW shall be entitled to terminate your employment on such terms as DEHW, in its discretion, considers reasonable.`, 10, false);
      currentY += 5;

      addText("ARTICLE 10: COMPASSIONATE LEAVE", 11, true);
      addWrappedText(`Up to a maximum of 3 working days per annum shall be allowed as compassionate leave for the purpose of attending to emergencies such as death or critical sickness of family members and other relations. Compassionate leave is subject to agreement with and approval of your line manager.`, 10, false);
      currentY += 5;

      addText("ARTICLE 11: MATERNITY LEAVE (Female Employees)", 11, true);
      addWrappedText(`Maternity leave shall be allowed at the rate of 90 days (3 calendar months). Maternity leave may be taken from TWO weeks before the expected delivery date.\nDEHW will compensate the employee 50% paid maternity leave for the first three months ONLY.`, 10, false);
      currentY += 3;
      addText("PATERNITY LEAVE (Male Employees)", 11, true);
      addWrappedText(`An employee who is a parent of a child will be entitled to 10 consecutive days' parental leave. This will effectively replace the three days' paternity leave currently provided for in the BCEA.\nParental leave may commence on the day the child is born.`, 10, false);
      currentY += 5;

      doc.addPage();
      currentY = 20;

      addText("ARTICLE 12: CONFIDENTIALITY", 11, true);
      addWrappedText(`You agree not to use, for your own benefit or for the benefit of any other person, and not to disclose to any third party, except in the ordinary and proper course of DEHW's business, any confidential information of DEHW; either while this agreement is in operation or after its termination.`, 10, false);
      currentY += 5;

      addText("ARTICLE 13: RESTRAINTS", 11, true);
      addWrappedText(`The employee undertakes and agrees that during the period of employment he/she shall not, without prior written consent from the employer, which consent shall not be unreasonably withheld:`, 10, false);
      addWrappedText(`• Accept any position of employment with another employer;`, 10, false, undefined, 5);
      addWrappedText(`• Incur any liability or debt or enter into any contract on behalf of the employer;`, 10, false, undefined, 5);
      addWrappedText(`• Disclose or divulge or communicate to any person not authorized to receive the information, any information belonging to the employer and / or relating to the employer's affairs or the affairs of any client or business associate of the employer;`, 10, false, undefined, 5);
      addWrappedText(`• The rights to any project of any nature developed during the course of employment. The employee has no claim to any benefit from such project other than, when granted by the employer in writing.`, 10, false, undefined, 5);
      currentY += 5;

      addText("ARTICLE 14: DISCIPLINARY, GRIEVANCE AND RETRENCHMENT PROCEDURES", 11, true);
      addWrappedText(`You will be bound by the disciplinary, grievance, and retrenchment procedures determined and communicated by DEHW from time to time.`, 10, false);
      currentY += 5;

      addText("ARTICLE 15: RETURN OF ASSETS AND RECORDS ON TERMINATION OF EMPLOYMENT", 11, true);
      addWrappedText(`On termination of your employment, you shall immediately deliver to DEHW all assets, records, documents, accounts, letters, notes, memoranda and papers of every description within your possession or control, relating to the affairs and business of DEHW, whether or not they were originally supplied by DEHW.`, 10, false);
      currentY += 5;

      addText("ARTICLE 16: GENERAL PROVISIONS", 11, true);
      addWrappedText(`No indulgence granted by a party shall constitute a waiver of any of that party's rights under this agreement; accordingly, that party shall not be precluded as a consequence of having granted such indulgence, from exercising any rights against the other which may have arisen in the past or which may arise in the future.`, 10, false);
      addWrappedText(`• No agreement varying, adding to, deleting from or cancelling this agreement, shall be effective unless produced to writing and signed by, or on behalf of, the parties;`, 10, false, undefined, 5);
      addWrappedText(`• This agreement, subject to clause below, and as read with the disciplinary, grievance and retrenchment procedures laid down by DEHW from time to time, shall constitute the entire contract between the parties with regard to the matters dealt with in this agreement, and no representations, terms, conditions or warranties not contained in this agreement shall be binding on the parties;`, 10, false, undefined, 5);
      addWrappedText(`• This agreement and the disciplinary, grievance and retrenchment procedures as laid down by DEHW from time to time, shall at all times be subject to the provisions of the Labour Relations Act, No. R66 of 1995 as amended and any other law applicable at the time, including the Basic conditions of Employment Act No. 75 of 1997.`, 10, false, undefined, 5);
      addWrappedText(`• You hereby expressly give DEHW permission to intercept, monitor, access, read, block or act upon any of your electronic communications including but not limited to e-mail correspondence, computer files stored on the computer or on your network or any storage device owned by DEHW including internal telephone/telefax transmissions.`, 10, false, undefined, 5);
      currentY += 5;

      addWrappedText(`If you agree to this offer on the terms it has been made, please sign a copy of this letter and the enclosed job description in space provided to signify acceptance and return it to the Project Manager within five days.`, 10, false);
      currentY += 5;

      addText("We take pleasure in welcoming you to the DEHW team and look forward to working with you. We hope that our relationship will be mutually rewarding.", 10, false);
      currentY += 5;
      
      addText("Yours sincerely,", 10, false);
      currentY += 15;

      // Signatures
      addText("RECOMMENDED:", 11, true);
      addText("PROJECT MANAGER: ___________________________________", 10, false);
      if (session.projectManagerSignature) {
        doc.addImage(session.projectManagerSignature, 'PNG', margin + 40, currentY - 10, 40, 15);
        addText(`Date: ${new Date(session.projectManagerSignedAt || '').toLocaleDateString()}`, 9, false);
      }
      currentY += 15;

      addText("APPROVED:", 11, true);
      addText("DIRECTOR: ___________________________________", 10, false);
      if (session.directorSignature) {
        doc.addImage(session.directorSignature, 'PNG', margin + 40, currentY - 10, 40, 15);
        addText(`Date: ${new Date(session.directorSignedAt || '').toLocaleDateString()}`, 9, false);
      }
      currentY += 15;
      
      // Page break for acceptance clause to keep it clean
      doc.addPage();
      currentY = 20;

      addText("ACCEPTANCE CLAUSE", 12, true, 'center');
      currentY += 5;
      addWrappedText(`I hereby accept and understand the conditions of employment as set out in this offer of fixed term employment. I confirm and accept that the contents of this letter have been explained to me, that the contents are fair and reasonable and agree to abide by the terms of this offer.`, 10, false);
      currentY += 10;
      
      addText(`Signed at ${safeValue(session.placeOfWork)} on this _______ day of ______________ 202____.`, 10, false);
      currentY += 20;

      // Split signatures side by side
      const halfW = pageWidth / 2;
      
      // Employee
      addText("___________________________________", 10, false, 'left', 0, 0);
      if (session.employeeSignature) {
        doc.addImage(session.employeeSignature, 'PNG', margin, currentY - 15, 40, 15);
      }
      addText("___________________________________", 10, false, 'left', 0, halfW - margin);
      if (session.witnessSignature) {
        doc.addImage(session.witnessSignature, 'PNG', halfW, currentY - 15, 40, 15);
      }
      currentY += 5;

      addText(`Employee's Name: ${safeValue(session.employeeName)}`, 10, false, 'left', 0, 0);
      addText(`Witnessed By: ${safeValue(session.witnessName)}`, 10, false, 'left', 0, halfW - margin);
      currentY += 5;

      addText(`Date: ${session.employeeSignedAt ? new Date(session.employeeSignedAt).toLocaleDateString() : '____________'}`, 10, false, 'left', 0, 0);
      addText(`Date: ${session.witnessSignedAt ? new Date(session.witnessSignedAt).toLocaleDateString() : '____________'}`, 10, false, 'left', 0, halfW - margin);

    } else {
      // Formal Offer
      addText('Formal Offer of Employment', 14, true, 'center');
      currentY += 15;

      const detailsBlock = [
        `Employee Name:         ${safeValue(session.employeeName)}`,
        `Offer Date:            ${safeValue(session.letterDate)}`,
        `Position Title:        ${safeValue(session.position)}`,
        `Employment Status:     ${safeValue(session.employmentStatus)}`,
        `Term of Contract:      ${safeValue(session.employmentStatus)}`,
        `Monthly Compensation:  ${safeValue(session.monthlySalary)}`,
        `Effective Start Date:  ${safeValue(session.startDate)}`,
        `Immediate Supervisor:  ${safeValue(session.supervisor)}`,
      ];
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      detailsBlock.forEach(line => {
        doc.text(line, margin, currentY);
        currentY += 6;
      });
      
      currentY += 10;
      addText(`Dear ${safeValue(session.employeeName)},`, 11, false);
      currentY += 5;
      
      addWrappedText(`We are pleased to extend you a formal offer of employment with Dunwell Executive Healthcare and Wellness in the position of ${safeValue(session.position)} based in ${safeValue(session.placeOfWork)}.`, 10, false);
      currentY += 5;
      
      addText("Upon your written acceptance of this offer, the following benefits will be extended to you:", 10, false);
      addWrappedText(`• Paid Annual leave of 21 days.`, 10, false, undefined, 5);
      addWrappedText(`• Paid Sick leave to maximum accrual as governed by local country law (carry over days per law).`, 10, false, undefined, 5);
      addWrappedText(`• Compassionate Leave per maximum days as governed by local country law.`, 10, false, undefined, 5);
      currentY += 10;

      addText("ACCEPTANCE OF OFFER", 11, true);
      addWrappedText(`I agree by signing below that I understand and agree to the terms and conditions of this offer extended by (Dunwell Executive Healthcare and Wellness) and no other terms apply.\nI agree that (Dunwell Executive Healthcare and Wellness) has made no other promises other than what is outlined in this offer letter. It contains the entire offer the DEHW is making me.\nAny changes in the terms of my employment, including benefits, must be authorized by the CEO & COO of the company.`, 10, false);
      currentY += 15;
      
      addText("Signature: ___________________________________", 10, false);
      if (session.employeeSignature) {
        doc.addImage(session.employeeSignature, 'PNG', margin + 20, currentY - 10, 40, 15);
      }
      addText(`Date: ${session.employeeSignedAt ? new Date(session.employeeSignedAt).toLocaleDateString() : '____________'}`, 10, false, 'left', 0, 100);
      currentY += 15;

      addText("ACKNOWLEDGEMENT OF JOB DESCRIPTION", 11, true);
      addWrappedText(`I have read the job description for the position offered to me and agree to its contents. I acknowledge that any other duties may be requested of me that are not specially stated here. I agree to perform these duties as directed by my immediate supervisor(s) when called upon.`, 10, false);
      currentY += 15;
      
      addText("Signature: ___________________________________", 10, false);
      if (session.employeeSignature) {
        doc.addImage(session.employeeSignature, 'PNG', margin + 20, currentY - 10, 40, 15);
      }
      addText(`Date: ${session.employeeSignedAt ? new Date(session.employeeSignedAt).toLocaleDateString() : '____________'}`, 10, false, 'left', 0, 100);
      currentY += 15;
      
      addText("AGREEMENT FROM DUNWELL EXECUTIVE HEALTHCARE & WELLNESS:", 11, true);
      currentY += 10;
      addText("Signature: ___________________________________", 10, false);
      if (session.companySignature) {
        doc.addImage(session.companySignature, 'PNG', margin + 20, currentY - 10, 40, 15);
      }
      addText(`Date: ${session.companySignedAt ? new Date(session.companySignedAt).toLocaleDateString() : '____________'}`, 10, false, 'left', 0, 100);
    }

    doc.save(`Dunwell_Contract_${session.employeeName?.replace(/\s+/g, '_') || 'Draft'}.pdf`);
  };

  return (
    <Button 
      onClick={generatePdf} 
      className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-6 h-auto shadow-md hover:shadow-lg transition-all hover:opacity-95"
    >
      <Download className="w-5 h-5 mr-2" />
      Download Signed PDF
    </Button>
  );
}
