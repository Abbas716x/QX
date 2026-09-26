import { useState, useCallback } from 'react';
import { fetchAllInvoices } from '../lib/db/turso';

/**
 * OpenRouter AI Analytics Hook
 * Analyzes multi-tenant sales metrics, trends, peak hours, and profitability
 */
export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState('');
  const [analysisStats, setAnalysisStats] = useState(null);

  const getApiKey = () => {
    return (
      sessionStorage.getItem('716QX_AI_KEY') ||
      import.meta.env.VITE_OPENROUTER_API_KEY ||
      ''
    );
  };

  const setApiKey = (key) => {
    if (key) {
      sessionStorage.setItem('716QX_AI_KEY', key.trim());
    } else {
      sessionStorage.removeItem('716QX_AI_KEY');
    }
  };

  /**
   * Extract summary statistics from invoices for the AI context
   */
  const prepareDataSummary = async (tenantFilter = 'all') => {
    const invoices = await fetchAllInvoices(tenantFilter, 1000);
    if (!invoices || invoices.length === 0) {
      return {
        summaryText: "لا توجد فواتير مسجلة في قاعدة البيانات حالياً.",
        count: 0,
        totalRevenue: 0
      };
    }

    const totalRevenue = invoices.reduce((acc, i) => acc + (Number(i.final_total) || 0), 0);
    const totalPaid = invoices.reduce((acc, i) => acc + (Number(i.paid) || 0), 0);
    const totalDebt = invoices.reduce((acc, i) => acc + (Number(i.debt) || 0), 0);

    // Group items popularity
    const itemStats = {};
    invoices.forEach((inv) => {
      try {
        const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : (inv.items || []);
        items.forEach((item) => {
          const name = item.name || 'غير معروف';
          if (!itemStats[name]) itemStats[name] = { qty: 0, revenue: 0 };
          const qty = Number(item.qty) || 1;
          const price = Number(item.cost || item.price) || 0;
          itemStats[name].qty += qty;
          itemStats[name].revenue += price * qty;
        });
      } catch (e) {
        // silent
      }
    });

    const sortedItems = Object.entries(itemStats).sort((a, b) => b[1].revenue - a[1].revenue);
    const topItems = sortedItems.slice(0, 8).map(([name, d]) => `- ${name}: طلب ${d.qty} مرة (إجمالي ${d.revenue.toLocaleString()} د.ع)`).join('\n');
    const lowItems = sortedItems.slice(-5).map(([name, d]) => `- ${name}: طلب ${d.qty} مرة (إجمالي ${d.revenue.toLocaleString()} د.ع)`).join('\n');

    // Tenant breakdown
    const tenantMap = {};
    invoices.forEach((inv) => {
      const tid = inv.tenant_id || 'general';
      if (!tenantMap[tid]) tenantMap[tid] = { count: 0, revenue: 0 };
      tenantMap[tid].count++;
      tenantMap[tid].revenue += Number(inv.final_total) || 0;
    });
    const tenantReport = Object.entries(tenantMap).map(([tid, d]) => `- صالة (${tid}): ${d.count} فاتورة بمجموع ${d.revenue.toLocaleString()} د.ع`).join('\n');

    const summaryText = `
إحصائيات النظام الشاملة:
- إجمالي عدد الفواتير: ${invoices.length}
- إجمالي الإيراد الصافي: ${totalRevenue.toLocaleString()} دينار عراقي
- إجمالي المبالغ النقدية المحصلة: ${totalPaid.toLocaleString()} د.ع
- إجمالي الديون الآجلة غير المسددة: ${totalDebt.toLocaleString()} د.ع
- نسبة الديون من المبيعات: ${totalRevenue > 0 ? ((totalDebt / totalRevenue) * 100).toFixed(1) : 0}%

الأصناف الأكثر مبيعاً وإيراداً:
${topItems || 'لا توجد بيانات تفصيلية'}

الأصناف الأقل طلباً:
${lowItems || 'لا توجد بيانات'}

توزيع المبيعات على الصالات:
${tenantReport || 'صالة واحدة فقط'}
    `.trim();

    return {
      summaryText,
      count: invoices.length,
      totalRevenue
    };
  };

  /**
   * Run Analysis via OpenRouter
   */
  const runAnalysis = useCallback(async (type, tenantFilter = 'all', customPrompt = '') => {
    const apiKey = getApiKey();
    if (!apiKey) {
      const msg = "يرجى إدخال وحفظ مفتاح OpenRouter API في حقل الإعدادات لتفعيل الذكاء الاصطناعي.";
      setError(msg);
      throw new Error(msg);
    }

    setLoading(true);
    setError(null);
    setResponse('');
    const startTime = Date.now();

    try {
      const summary = await prepareDataSummary(tenantFilter);

      const promptCatalog = {
        daily: "حلل أداء مبيعات اليوم، وقدم ملخصاً سريعاً لأعلى الساعات أو الفترات حركة، ونسبة تسديد الديون، وتوصية عملية لزيادة الإيراد اليومي.",
        weekly: "قدم تقريراً مالياً للأداء الأسبوعي يشمل مقارنة الفروع، وأبرز محركات الدخل، ونقاط الهدر أو الأصناف الراكدة.",
        peak: "استناداً لتكرار الطلبات ونوعية الخدمات (وقت منضدة/بلي مقابل المشروبات)، حدد أوقات وسلوك الاستهلاك المقترح وكيفية تسريع حركة الطاولات.",
        items: "حلل قائمة المنيو: ما هي الأصناف الذهبية الأكثر ربحية؟ وما هي الأصناف الضعيفة المقترح حذفها أو تعديل أسعارها؟",
        custom: customPrompt
      };

      const systemPrompt = `أنت خبير ذكاء اصطناعي ومستشار مالي وإداري متخصص في إدارة صالات الترفيه والمقاهي وصالات الألعاب في العراق. تعمل مع نظام 716QX Cloud POS. إجاباتك باللغة العربية الفصحى، منظمة، مختصرة، وعملية وتعتمد مباشرة على الأرقام المعطاة.`;
      const userPrompt = `${promptCatalog[type] || promptCatalog.daily}\n\nبيانات النظام الحقيقية:\n${summary.summaryText}`;

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "716QX SaaS POS AI"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 1500,
          temperature: 0.4
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `خطأ OpenRouter (${res.status})`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "لم يتم استلام رد من النموذج.";
      const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

      setResponse(content);
      setAnalysisStats({
        invoicesCount: summary.count,
        revenue: summary.totalRevenue,
        timeSeconds: elapsedSec
      });

      return content;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    response,
    analysisStats,
    runAnalysis,
    getApiKey,
    setApiKey,
    hasApiKey: !!getApiKey()
  };
}
