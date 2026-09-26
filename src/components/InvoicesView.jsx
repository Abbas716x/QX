import React, { useState, useMemo } from 'react';
import { Search, Download, Receipt, Eye, X, Calendar, User } from 'lucide-react';

export const InvoicesView = React.memo(function InvoicesView({ invoices }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices || [];
    const q = searchQuery.toLowerCase();
    return (invoices || []).filter(
      (inv) =>
        (inv.id && inv.id.toLowerCase().includes(q)) ||
        (inv.tableName && inv.tableName.toLowerCase().includes(q)) ||
        (inv.customer && inv.customer.toLowerCase().includes(q))
    );
  }, [invoices, searchQuery]);

  const exportCSV = () => {
    if (!filteredInvoices || filteredInvoices.length === 0) return;
    const headers = ['Invoice ID', 'Table', 'Customer', 'Subtotal', 'Discount', 'Final Total', 'Paid', 'Debt', 'Date'];
    const rows = filteredInvoices.map((i) => [
      i.id || '',
      i.tableName || '',
      i.customer || '',
      i.subtotal || 0,
      i.discount || 0,
      i.finalTotal || 0,
      i.paid || 0,
      i.debt || 0,
      i.date || ''
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `716QX_Invoices_${new Date().toLocaleDateString('en-CA')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white font-ar">
            أرشيف الفواتير المكتملة
          </h2>
          <p className="text-gray-400 text-xs md:text-sm mt-1 font-ar">
            سجل سحابي مؤرخ لجميع الفواتير مع تفاصيل الطلبات والمبالغ والديون
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث برقم الفاتورة أو الزبون..."
              className="w-full bg-panelDark/80 border border-white/10 rounded-2xl pr-11 pl-4 py-3 outline-none focus:border-cyanGlow transition-all text-xs font-bold text-white placeholder-gray-500"
            />
          </div>

          <button
            onClick={exportCSV}
            className="px-5 py-3 rounded-2xl bg-emeraldGlow/10 hover:bg-emeraldGlow/20 text-emeraldGlow border border-emeraldGlow/20 text-xs font-bold transition-all flex items-center gap-2 shrink-0 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel</span>
          </button>
        </div>
      </div>

      {/* Invoices Table Card */}
      <div className="glass-card rounded-3xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-right border-collapse text-xs font-ar">
            <thead>
              <tr className="bg-black/40 text-gray-400 font-bold border-b border-white/10 sticky top-0 backdrop-blur-md">
                <th className="p-4">رقم الفاتورة</th>
                <th className="p-4">الطاولة / الزبون</th>
                <th className="p-4">الإجمالي الصافي</th>
                <th className="p-4">المدفوع كاش</th>
                <th className="p-4">المحول كدين</th>
                <th className="p-4">التاريخ والوقت</th>
                <th className="p-4 text-center">عرض</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-500 font-bold">
                    لا توجد فواتير مطابقة
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono font-bold text-cyanGlow" dir="ltr">
                      {inv.id}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-white block">{inv.tableName}</span>
                      <span className="text-[11px] text-gray-400">{inv.customer || 'زبون عام'}</span>
                    </td>
                    <td className="p-4 font-en font-black text-white text-sm">
                      {Number(inv.finalTotal || 0).toLocaleString()} د.ع
                    </td>
                    <td className="p-4 font-en font-bold text-emeraldGlow">
                      {Number(inv.paid || 0).toLocaleString()} د.ع
                    </td>
                    <td className="p-4 font-en font-bold">
                      {Number(inv.debt || 0) > 0 ? (
                        <span className="text-roseAlert">
                          {Number(inv.debt).toLocaleString()} د.ع
                        </span>
                      ) : (
                        <span className="text-gray-500">0</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-400 font-mono text-[11px] whitespace-nowrap">
                      {inv.date}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all inline-flex items-center justify-center"
                        title="عرض تفاصيل الفاتورة"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVOICE DETAILS MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-[600] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 sm:p-8 rounded-3xl border-t-4 border-cyanGlow space-y-5 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-cyanGlow" />
                <h3 className="text-lg font-black text-white font-ar">
                  تفاصيل الفاتورة
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="w-7 h-7 rounded-lg bg-white/5 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info header */}
            <div className="bg-panelDark/80 p-4 rounded-2xl border border-white/5 space-y-1.5 text-xs font-ar">
              <div className="flex justify-between text-gray-400 font-mono">
                <span>رقم الفاتورة:</span>
                <span className="text-white font-bold">{selectedInvoice.id}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>الطاولة:</span>
                <span className="text-white font-bold">{selectedInvoice.tableName}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>الزبون:</span>
                <span className="text-cyanGlow font-bold">{selectedInvoice.customer || 'زبون عام'}</span>
              </div>
              <div className="flex justify-between text-gray-400 font-mono">
                <span>التاريخ:</span>
                <span>{selectedInvoice.date}</span>
              </div>
            </div>

            {/* Items list */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <h4 className="text-xs font-bold text-gray-300 font-ar">قائمة الطلبات:</h4>
              {(selectedInvoice.items || []).map((itm, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-panelDark/60 border border-white/5 flex justify-between items-center text-xs font-ar"
                >
                  <span className="font-bold text-white">
                    {itm.name} {itm.qty > 1 ? `(×${itm.qty})` : ''}
                  </span>
                  <span className="font-en font-bold text-cyanGlow">
                    {Number(itm.cost || itm.price || 0).toLocaleString()} د.ع
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs font-ar">
              <div className="flex justify-between text-gray-400">
                <span>الإجمالي:</span>
                <span className="font-en font-bold text-white">{Number(selectedInvoice.finalTotal || 0).toLocaleString()} د.ع</span>
              </div>
              <div className="flex justify-between text-emeraldGlow">
                <span>المدفوع كاش:</span>
                <span className="font-en font-bold">{Number(selectedInvoice.paid || 0).toLocaleString()} د.ع</span>
              </div>
              {Number(selectedInvoice.debt || 0) > 0 && (
                <div className="flex justify-between text-roseAlert">
                  <span>المحول كدين:</span>
                  <span className="font-en font-bold">{Number(selectedInvoice.debt).toLocaleString()} د.ع</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedInvoice(null)}
              className="w-full py-3 rounded-xl glow-btn-cyan text-xs font-black text-black"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
