type PrintHtmlDocumentArgs = {
  bodyHtml: string;
  extraCss?: string;
  title?: string;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export const formatPrintDocumentTitle = (
  prefix: string,
  documentNumber?: string | null,
) => {
  const normalizedNumber = documentNumber?.trim().replaceAll('/', '-') || prefix;
  return `${prefix} ${normalizedNumber}`;
};

export const printHtmlDocument = ({
  bodyHtml,
  extraCss = '',
  title = 'Document',
}: PrintHtmlDocumentArgs) => {
  const originalTitle = document.title;
  let restored = false;
  const restoreTitle = () => {
    if (restored) return;
    restored = true;
    document.title = originalTitle;
    window.removeEventListener('focus', handleFocus);
  };
  const handleFocus = () => {
    window.setTimeout(restoreTitle, 0);
  };

  document.title = title;
  window.addEventListener('focus', handleFocus, { once: true });

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    restoreTitle();
    return;
  }

  const stylesheets = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        if (sheet.href) {
          return `<link rel="stylesheet" href="${sheet.href}" />`;
        }
        const rules = Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join('\n');
        return `<style>${rules}</style>`;
      } catch {
        return sheet.href
          ? `<link rel="stylesheet" href="${sheet.href}" />`
          : '';
      }
    })
    .join('\n');

  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    ${stylesheets}
    <style>
      @page { size: A4; margin: 0; }
      html, body { margin: 0; padding: 0; background: white; }
      ${extraCss}
    </style>
  </head>
  <body>${bodyHtml}</body>
</html>`);
  doc.close();

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(restoreTitle, 1000);
      setTimeout(() => iframe.remove(), 1000);
    }, 250);
  };
};
