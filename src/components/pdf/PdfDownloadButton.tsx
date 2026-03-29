'use client';

import { Download } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { CostBreakdownPdf } from './CostBreakdownPdf';
import { ChecklistPdf } from './ChecklistPdf';
import type { WizardData } from '@/lib/store';
import type { CostBreakdown } from '@/lib/calculator';
import { useState } from 'react';

interface Props {
  data: WizardData;
  results: CostBreakdown;
  locale: 'de' | 'en';
}

export default function PdfDownloadButton({ data, results, locale }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const downloadPdf = async (type: 'breakdown' | 'checklist') => {
    setLoading(type);
    try {
      const doc =
        type === 'breakdown'
          ? CostBreakdownPdf({ data, results, locale })
          : ChecklistPdf({ data, results, locale });

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'breakdown' ? 'import-costs.pdf' : 'import-checklist.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF generation failed:', e);
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <button
        onClick={() => downloadPdf('breakdown')}
        disabled={loading === 'breakdown'}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-swiss-red text-white text-sm font-medium hover:bg-swiss-red-dark transition-colors cursor-pointer"
      >
        <Download className="w-4 h-4" />
        {loading === 'breakdown'
          ? '...'
          : locale === 'de'
          ? 'Kostenübersicht PDF'
          : 'Cost breakdown PDF'}
      </button>
      <button
        onClick={() => downloadPdf('checklist')}
        disabled={loading === 'checklist'}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-dark text-white text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
      >
        <Download className="w-4 h-4" />
        {loading === 'checklist'
          ? '...'
          : locale === 'de'
          ? 'Checkliste PDF'
          : 'Checklist PDF'}
      </button>
    </>
  );
}
