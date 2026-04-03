import { forwardRef } from 'react';
import {
  invoiceFormatCurrency,
  type Customer,
  type Quotation,
  type QuotationItem,
} from '~/lib/data';

interface QuotationDocumentProps {
  quotation: Quotation;
  customer: Customer | null;
  items: Array<
    QuotationItem & {
      item_code?: string;
    }
  >;
}

const formatDocumentDate = (value?: number) => {
  if (!value) return '-';

  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const addOneMonth = (value?: number) => {
  if (!value) return undefined;

  const date = new Date(value);
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next.getTime();
};

export const QuotationDocument = forwardRef<
  HTMLDivElement,
  QuotationDocumentProps
>(function QuotationDocument({ quotation, customer, items }, ref) {
  const validUntil = addOneMonth(quotation.created_at);

  return (
    <div
      ref={ref}
      className="invoice-page min-h-[297mm] bg-white p-[15mm_20mm] shadow-sm text-black font-sans flex flex-col"
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

        <h2 className="text-center text-2xl font-bold font-serif my-8">
          QUOTATION
        </h2>

        <section className="flex justify-between mb-8 text-sm">
          <div className="max-w-[50%]">
            <h3 className="font-bold underline mb-1 uppercase text-xs">
              Consignee:
            </h3>
            <div className="leading-relaxed w-[250px]">
              <p>{customer?.company}</p>
              {customer?.address ?? ''}
            </div>
          </div>

          <div className="text-sm">
            <table className="border-collapse">
              <tbody>
                <tr>
                  <td className="font-bold pr-2 py-0.5 whitespace-nowrap">
                    Quotation No
                  </td>
                  <td>: {quotation.number}</td>
                </tr>
                <tr>
                  <td className="font-bold pr-2 py-0.5 whitespace-nowrap">
                    Valid Until
                  </td>
                  <td>: {formatDocumentDate(validUntil)}</td>
                </tr>
                <tr>
                  <td className="font-bold pr-2 py-0.5 whitespace-nowrap">
                    Date
                  </td>
                  <td>: {formatDocumentDate(quotation.created_at)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
          <table className="w-full border-collapse border border-black text-sm mb-8">
            <thead>
              <tr className="font-bold text-center">
                <th className="border border-black p-2 w-[13%]">
                  Item
                  <br />
                  Code
                </th>
                <th className="border border-black p-2 w-[37%] text-left">
                  Description
                </th>
                <th className="border border-black p-2 w-[12%]">
                  Qty
                  <br />
                  KGS
                </th>
                <th className="border border-black p-2 w-[16%]">
                  Unit
                  <br />
                  Price /SLR
                </th>
                <th className="border border-black p-2 w-[22%]">
                  Total Value
                  <br />
                  SLR
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={item.id ?? `${item.product_id}-${index}`}
                  className="h-24 align-top text-center"
                >
                  <td className="border border-black p-2">
                    {item.item_code ?? ''}
                  </td>
                  <td className="border border-black p-2 text-left leading-relaxed">
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
                  {invoiceFormatCurrency(quotation.subtotal)}
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="border-none"></td>
                <td className="border border-black p-2 text-center font-bold">
                  VAT 18%
                </td>
                <td className="border border-black p-2 text-right">
                  {invoiceFormatCurrency(quotation.tax)}
                </td>
              </tr>
              <tr className="font-bold">
                <td colSpan={3} className="border-none"></td>
                <td className="border border-black p-2 text-center">Total :</td>
                <td className="border border-black p-2 text-right">
                  {invoiceFormatCurrency(quotation.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <footer
        className="mt-auto pt-6"
        style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
      >
        <hr className="border-t-2 border-dashed border-black mb-3" />
        <div className="text-center text-[12px] text-zinc-600">
          No. 3/6A, Edirigoda Road, Nugegoda. Tel. +94 777 766006, 777 767260
          Email: arl.adhesives@gmail.com
        </div>
      </footer>
    </div>
  );
});
