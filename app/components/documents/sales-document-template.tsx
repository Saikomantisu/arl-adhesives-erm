import { forwardRef, type ReactNode } from 'react';
import {
  invoiceFormatCurrency,
  type Customer,
  type SalesLineItem,
} from '~/lib/data';

interface SalesDocumentTemplateProps {
  documentTitle: string;
  numberLabel: string;
  number?: string;
  createdAt?: number;
  poNumber?: string | null;
  customer: Customer | null;
  items: SalesLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  extraRows?: Array<{
    label: string;
    value: ReactNode;
  }>;
}

export const SalesDocumentTemplate = forwardRef<
  HTMLDivElement,
  SalesDocumentTemplateProps
>(function SalesDocumentTemplate(
  {
    documentTitle,
    numberLabel,
    number,
    createdAt,
    poNumber,
    customer,
    items,
    subtotal,
    tax,
    total,
    extraRows = [],
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className="invoice-page min-h-[297mm] bg-white p-[15mm_20mm] font-sans shadow-sm text-black flex flex-col"
    >
      <div className="flex-1">
        <header className="mb-4 font-serif">
          <h1 className="text-[26px] font-bold text-[#2a5f8f] underline leading-tight">
            ARL Adhesives
          </h1>
          <div className="text-[13px] italic text-[#2a5f8f] leading-normal">
            No.3/6A, Edirigoda Road, Nugegoda, Sri Lanka.
            <br />
            Phone : +94 777 767260, +94 777 766006
            <br />
            Email : arl.adhesives@gmail.com
          </div>
          <div className="text-[13px] italic text-[#2a5f8f] mt-1">
            VAT Registration Number: 103506638 - 7000
          </div>
        </header>

        <div className="text-right italic text-sm mb-2">Customer Copy</div>

        <h2 className="text-center text-2xl font-bold mb-8 font-serif">{documentTitle}</h2>

        <div className="flex justify-between mb-8 text-sm">
          <div className="max-w-[50%]">
            <h3 className="font-bold underline mb-1 uppercase text-xs">
              Consignee:
            </h3>
            <p className="leading-relaxed">{customer?.company},</p>

            <p className="leading-relaxed w-[200px]">
              {customer?.address ?? ''}
            </p>

            <p className="leading-relaxed">
              VAT Registration No: {customer?.vat_reg_no}
            </p>
          </div>

          <div className="text-sm">
            <table className="border-collapse">
              <tbody>
                <tr>
                  <td className="font-bold pr-2 py-0.5 whitespace-nowrap">
                    {numberLabel}
                  </td>
                  <td>: {number}</td>
                </tr>
                <tr>
                  <td className="font-bold pr-2 py-0.5 whitespace-nowrap">
                    Date
                  </td>
                  <td>
                    :{' '}
                    {createdAt
                      ? new Date(createdAt).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })
                      : '-'}
                  </td>
                </tr>
                {poNumber ? (
                  <tr>
                    <td className="font-bold pr-2 py-0.5 whitespace-nowrap">
                      P.O. No
                    </td>
                    <td>: {poNumber}</td>
                  </tr>
                ) : null}
                {extraRows.map((row) => (
                  <tr key={row.label}>
                    <td className="font-bold pr-2 py-0.5 whitespace-nowrap">
                      {row.label}
                    </td>
                    <td>: {row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <table className="w-full border-collapse border border-black text-sm mb-8">
          <thead>
            <tr className="font-bold text-center">
              <th className="border border-black p-2 w-[12%]">Item Code</th>
              <th className="border border-black p-2 w-[36%] text-left">
                Description
              </th>
              <th className="border border-black p-2 w-[12%]">Qty KGS</th>
              <th className="border border-black p-2 w-[18%]">
                Unit Price /SLR
              </th>
              <th className="border border-black p-2 w-[22%]">
                Total Value SLR
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id ?? item.product_id}
                className="h-24 align-top text-center"
              >
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2 text-left">
                  {item.name}
                  <br />
                  Make : Malaysia
                  <br />
                  Brand : Adtek
                </td>
                <td className="border border-black p-2">
                  {item.total_weight_kg}
                </td>
                <td className="border border-black p-2">
                  {invoiceFormatCurrency(item.price_per_kg)}
                </td>
                <td className="border border-black p-2 text-right font-medium">
                  {invoiceFormatCurrency(item.total_price)}
                </td>
              </tr>
            ))}

            <tr>
              <td colSpan={3} className="border-none"></td>
              <td className="border border-black p-2 text-center font-bold">
                Sub Total
              </td>
              <td className="border border-black p-2 text-right">
                {invoiceFormatCurrency(subtotal)}
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="border-none"></td>
              <td className="border border-black p-2 text-center font-bold">
                VAT 18%
              </td>
              <td className="border border-black p-2 text-right">
                {invoiceFormatCurrency(tax)}
              </td>
            </tr>
            <tr className="font-bold">
              <td colSpan={3} className="border-none"></td>
              <td className="border border-black p-2 text-center">Total :</td>
              <td className="border border-black p-2 text-right">
                {invoiceFormatCurrency(total)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="text-sm leading-relaxed mt-8">
          Draw the cheque in favour of <strong>{customer?.payee}</strong>, A/C
          payee only.
        </div>

        <div className="flex flex-col items-end mt-20">
          <div className="w-48 border-b border-black border-dotted mb-1"></div>
          <span className="text-[13px] pr-8">Checked & Issued by</span>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <hr className="border-t-2 border-dashed border-black mb-3" />
        <div className="text-center text-[12px] text-zinc-600">
          No. 3/6A, Edirigoda Road, Nugegoda. Tel. +94 777 766006, 777 767260
          Email: arl.adhesives@gmail.com
        </div>
      </div>
    </div>
  );
});
