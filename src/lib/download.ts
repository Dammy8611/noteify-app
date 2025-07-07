'use client';

import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

type NoteData = {
  title: string;
  content: string;
};

const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadAsTxt = (note: NoteData) => {
  const content = `Title: ${note.title}\n\n${note.content}`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveBlob(blob, `${note.title}.txt`);
};

type ParsedSegment = {
    text: string;
    bold?: boolean;
    italic?: boolean;
    isCode?: boolean;
}

type ParsedLine = 
    | { type: 'h1'; text: string }
    | { type: 'h2'; text: string }
    | { type: 'li'; text: string }
    | { type: 'p'; segments: ParsedSegment[] }
    | { type: 'br' };


// A simple parser for our markdown-like syntax for jsPDF and docx
const parseMarkdownForDownloads = (content: string): ParsedLine[] => {
  if (!content) return [];
  const lines = content.split('\n');
  return lines.map(line => {
    if (line.startsWith('## ')) {
      return { type: 'h2' as const, text: line.substring(3) };
    }
    if (line.startsWith('# ')) {
      return { type: 'h1' as const, text: line.substring(2) };
    }
    if (line.startsWith('- ')) {
        return { type: 'li' as const, text: line.substring(2) };
    }
    if (line.trim() === '') {
        return { type: 'br' as const };
    }

    const segments: ParsedSegment[] = [];
    // This regex handles **bold**, _italic_, and `code`
    const regex = /(\*\*.+?\*\*|_.+?_|`.+?`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      // Add the text before the match
      if (match.index > lastIndex) {
        segments.push({ text: line.substring(lastIndex, match.index) });
      }
      
      const matchedText = match[0];
      if (matchedText.startsWith('**')) {
        segments.push({ text: matchedText.slice(2, -2), bold: true });
      } else if (matchedText.startsWith('_')) {
        segments.push({ text: matchedText.slice(1, -1), italic: true });
      } else if (matchedText.startsWith('`')) {
        segments.push({ text: matchedText.slice(1, -1), isCode: true });
      }
      
      lastIndex = match.index + matchedText.length;
    }

    // Add any remaining text after the last match
    if (lastIndex < line.length) {
      segments.push({ text: line.substring(lastIndex) });
    }
    
    return { type: 'p' as const, segments };
  });
};

export const downloadAsPdf = (note: NoteData) => {
  const doc = new jsPDF();
  const parsedContent = parseMarkdownForDownloads(note.content);
  let y = 20;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const x = 15;
  const maxWidth = doc.internal.pageSize.width - (margin * 2);

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(note.title, x, y);
  y += 15;

  parsedContent.forEach(item => {
    if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
    }
    
    if (item.type === 'h1') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      const splitText = doc.splitTextToSize(item.text, maxWidth);
      doc.text(splitText, x, y);
      y += (splitText.length * 7) + 5;
    } else if (item.type === 'h2') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      const splitText = doc.splitTextToSize(item.text, maxWidth);
      doc.text(splitText, x, y);
      y += (splitText.length * 6) + 4;
    } else if (item.type === 'li') {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const bulletPoint = `• ${item.text}`;
        const splitText = doc.splitTextToSize(bulletPoint, maxWidth - 5);
        doc.text(splitText, x + 5, y);
        y += (splitText.length * 5) + 2;
    } else if (item.type === 'p') {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      // Simplified for PDF: Render line by line, doesn't handle inline style changes mid-line
      const fullLineText = item.segments.map(s => s.text).join('');
      const splitText = doc.splitTextToSize(fullLineText, maxWidth);
      doc.text(splitText, x, y);
      y += (splitText.length * 5) + 3;
    } else if (item.type === 'br') {
        y += 5; // spacing for empty lines
    }
  });

  doc.save(`${note.title}.pdf`);
};

export const downloadAsDocx = async (note: NoteData) => {
    const parsedContent = parseMarkdownForDownloads(note.content);

    const docChildren: Paragraph[] = [
        new Paragraph({
            text: note.title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
        }),
    ];

    parsedContent.forEach(item => {
        if (item.type === 'h1') {
            docChildren.push(new Paragraph({ text: item.text, heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }));
        } else if (item.type === 'h2') {
            docChildren.push(new Paragraph({ text: item.text, heading: HeadingLevel.HEADING_2, spacing: { before: 150, after: 75 } }));
        } else if (item.type === 'li') {
            docChildren.push(new Paragraph({ text: item.text, bullet: { level: 0 } }));
        } else if (item.type === 'p') {
            const textRuns = item.segments.map(segment => {
                const textRun = new TextRun({
                    text: segment.text,
                    bold: segment.bold,
                    italics: segment.italic,
                });
                if (segment.isCode) {
                    return textRun.font('Courier New');
                }
                return textRun;
            });
            docChildren.push(new Paragraph({ children: textRuns }));
        } else if (item.type === 'br') {
             docChildren.push(new Paragraph({ text: "" }));
        }
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children: docChildren,
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveBlob(blob, `${note.title}.docx`);
};
