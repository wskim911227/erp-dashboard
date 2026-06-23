declare module "jspdf-autotable" {
  import { jsPDF } from "jspdf";

  interface AutoTableOptions {
    startY?: number;
    head?: string[][];
    body?: string[][];
    margin?: { left?: number; right?: number; top?: number; bottom?: number };
    theme?: string;
    headStyles?: Record<string, unknown>;
  }

  export default function autoTable(doc: jsPDF, options: AutoTableOptions): void;
}

declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}
