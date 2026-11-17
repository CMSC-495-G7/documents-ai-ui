import { pdfjs } from 'react-pdf';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// The kit's PDF preview can't find pdf.js's worker under `npm run dev`
// (its README says the app sets it). Loaded only when a PDF opens.
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
