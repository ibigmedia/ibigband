"use client";

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  fileUrl: string;
}

export default function PdfViewer({ fileUrl }: Props) {
  return (
    <Document 
      file={fileUrl} 
      loading={<p className="p-10 font-bold">PDF 파일 불러오는 중...</p>}
      error={<p className="p-10 text-red-500 font-bold">PDF를 불러오는 데 실패했습니다.</p>}
    >
      <Page pageNumber={1} width={800} renderAnnotationLayer={false} renderTextLayer={false} />
    </Document>
  );
}
