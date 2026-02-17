import type { Aod, Invoice } from '~/lib/data';

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

type AodTemplateArgs = {
  aod: Aod;
  invoice: Invoice;
  customer?: { company?: string | null; address?: string | null } | null;
  items?: Array<{ name?: string | null; total_weight_kg?: number | string | null }> | null;
};

export function buildAodHtml({ aod, invoice, customer, items }: AodTemplateArgs): {
  html: string;
  extraCss: string;
} {
  const printedDate = new Date(aod.printed_at).toLocaleDateString('en-UK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const poNumber = invoice.po_number ?? aod.po_number ?? '';

  const itemRows = (items ?? [])
    .map((item) => {
      const name = escapeHtml(item?.name);
      const qty = escapeHtml(item?.total_weight_kg);
      return `
        <tr class="align-top">
          <td class="border border-black p-2 text-center h-[80px]">${escapeHtml(poNumber)}</td>
          <td class="border border-black p-2 text-center h-[80px]"></td>
          <td class="border border-black p-2 h-[80px]">
            ${name}<br />
            Make : Malayasia<br />
            Brand : Adtek
          </td>
          <td class="border border-black p-2 text-center h-[80px]">${qty}</td>
        </tr>
      `;
    })
    .join('');

  // This row intentionally leaves border gaps (to match the original print).
  const packingNoteRow = `
    <tr>
      <td class="border-none p-2"></td>
      <td class="border-none p-2"></td>
      <td class="border border-black p-2 italic">25kg bulk packing in Adtek Paper Sack</td>
      <td class="border-none p-2"></td>
    </tr>
  `;

  const html = `
    <div class="w-[210mm] min-h-[297mm] bg-white text-black font-serif text-[14px] p-[15mm_20mm_10mm_20mm] shadow-sm flex flex-col">
      <div class="flex-1">
        <div class="mb-4">
          <div class="text-[26px] font-bold text-[#2a5f8f] underline leading-tight">ARL Adhesives</div>
          <div class="text-[13px] italic text-[#2a5f8f] leading-normal">
            No.3/6A, Edirigoda Road, Nugegoda, Sri Lanka.<br />
            Phone : +94 777 767260, +94 777 766006<br />
            Email : arl.adhesives@gmail.com
          </div>
        </div>

        <div class="text-right italic text-sm mb-2">Customer Copy</div>

        <div class="text-center text-2xl font-bold mb-8">ADVICE OF DISPATCH</div>

        <div class="flex justify-between mb-8">
          <div class="max-w-[50%]">
            <div class="font-bold underline mb-1">Consignee:</div>
            <p class="leading-relaxed w-[200px]">
              ${escapeHtml(customer?.company)}<br />
              ${customer?.address}
            </p>
          </div>

          <div>
            <table class="border-collapse text-[14px]">
              <tr>
                <td class="font-bold whitespace-nowrap pr-2 py-0.5 align-top">A.O.D No</td>
                <td class="py-0.5 align-top">: ${escapeHtml(aod.aod_number)}</td>
              </tr>
              <tr>
                <td class="font-bold whitespace-nowrap pr-2 py-0.5 align-top">Date</td>
                <td class="py-0.5 align-top">: ${escapeHtml(printedDate)}</td>
              </tr>
              <tr>
                <td class="font-bold whitespace-nowrap pr-2 py-0.5 align-top">P.O. No</td>
                <td class="py-0.5 align-top">: ${escapeHtml(invoice.po_number)}</td>
              </tr>
              <tr>
                <td class="font-bold whitespace-nowrap pr-2 py-0.5 align-top">Invoice No</td>
                <td class="py-0.5 align-top">: ${escapeHtml(invoice.number)}</td>
              </tr>
            </table>
          </div>
        </div>

        <table class="w-full border-collapse mb-6">
          <thead>
            <tr class="font-bold text-center">
              <th class="border border-black p-2 w-[22%]">PO No</th>
              <th class="border border-black p-2 w-[15%]">Item Code</th>
              <th class="border border-black p-2 w-[43%]">Description</th>
              <th class="border border-black p-2 w-[20%]">Qty<br />KGS</th>
            </tr>
          </thead>
          <tbody>
            ${
              itemRows ||
              `<tr class="align-top">
                <td class="border border-black p-2 text-center h-[80px]">${escapeHtml(poNumber)}</td>
                <td class="border border-black p-2 text-center h-[80px]"></td>
                <td class="border border-black p-2 h-[80px]">No items</td>
                <td class="border border-black p-2 text-center h-[80px]"></td>
              </tr>`
            }
            ${packingNoteRow}
          </tbody>
        </table>

        <div class="mt-8 text-[13px] leading-relaxed max-w-[90%]">
          Any discrepancy on quality or quantity of goods received should be informed us within 24
          hours of the delivery or it would be considered as correct and we shall not be liable for
          same.
        </div>

        <div class="text-right mt-6 mb-4 text-sm">Good received are in order</div>

        <div class="flex justify-between items-end mt-20 px-[5mm]">
          <div class="text-center">
            <div class="inline-block w-[45mm] border-b border-dotted border-black mb-1">&nbsp;</div>
            <div class="text-[13px] mt-1">Authorized by</div>
          </div>

          <div class="text-center">
            <div class="inline-block w-[45mm] border-b border-dotted border-black mb-1">&nbsp;</div>
            <div class="text-[13px] mt-1">Signature, Seal & Date</div>
          </div>
        </div>
      </div>

      <div class="mt-auto pt-6">
        <div class="h-1 bg-[#2a5f8f] mb-4"></div>
        <hr class="border-0 border-t-2 border-dashed border-black mb-4" />
        <div class="text-center text-[11px] text-zinc-700">
          No. 3/6A, Edirigoda Road, Nugegoda. Tel. +94 777 766006, 777 767260 Email:
          arl.adhesives@gmail.com
        </div>
      </div>
    </div>
  `;

  // Keep only print-specific rules here; layout is Tailwind-based.
  const extraCss = `
    @page { size: A4; margin: 5mm; }
    html, body { background: white; }
  `;

  return { html, extraCss };
}
