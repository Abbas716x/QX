/**
 * 716QX SaaS Management & UI Controller
 * Handles Shop Login, Subscription Overlays, and Admin Central Dashboard.
 */
window.SaaS = {
    // Submit shop login form
    login: async function() {
        const idInput = document.getElementById('login-shop-id');
        const passInput = document.getElementById('login-shop-passcode');
        const errEl = document.getElementById('login-err-msg');
        const btn = document.getElementById('btn-login-submit');

        const tenantId = idInput?.value?.trim();
        const passcode = passInput?.value?.trim();

        if (errEl) errEl.classList.add('hidden');

        if (!tenantId || !passcode) {
            if (errEl) {
                errEl.innerText = 'يرجى إدخال رمز الصالة ورمز الدخول';
                errEl.classList.remove('hidden');
            }
            return;
        }

        try {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<span class="animate-spin inline-block mr-2">🔄</span> جاري التحقق والاتصال...`;
            }

            await window.CloudDB.loginShop(tenantId, passcode);
        } catch (err) {
            if (err.isBlocked) {
                window.CloudDB.hideLoginModal();
                window.CloudDB.showBlockedScreen(err.name);
            } else if (errEl) {
                errEl.innerText = err.message || 'حدث خطأ في تسجيل الدخول';
                errEl.classList.remove('hidden');
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = 'تسجيل الدخول والبدء ➔';
            }
        }
    },

    // Quick fill for demo / testing
    quickFill: function(id, pass) {
        const idInput = document.getElementById('login-shop-id');
        const passInput = document.getElementById('login-shop-passcode');
        if (idInput) idInput.value = id;
        if (passInput) passInput.value = pass;
    },

    // Prompt for admin key and open portal
    openAdminPortal: function() {
        const pin = prompt('أدخل الرمز السري للأدمن العام (Master Admin Key):', '');
        if (!pin) return;

        if (window.CloudDB.adminAuth(pin)) {
            window.CloudDB.hideLoginModal();
            window.CloudDB.hideBlockedScreen();
            const modal = document.getElementById('modal-admin-portal');
            if (modal) modal.classList.remove('hidden');
            this.loadAdminShops();
        } else {
            alert('الرمز السري غير صحيح!');
        }
    },

    closeAdminPortal: function() {
        const modal = document.getElementById('modal-admin-portal');
        if (modal) modal.classList.add('hidden');

        // If no active tenant, bring back login modal
        if (!window.CloudDB.getCurrentTenant()) {
            window.CloudDB.showLoginModal();
        }
    },

    // Load shops list in admin dashboard
    loadAdminShops: async function() {
        const tbody = document.getElementById('admin-shops-tbody');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-400 font-bold"><span class="animate-spin inline-block mr-2">🔄</span> جاري تحميل الصالات...</td></tr>`;

        try {
            const shops = await window.CloudDB.adminGetShops();

            let activeCount = 0;
            let blockedCount = 0;
            shops.forEach(s => {
                if (s.status === 'active') activeCount++;
                else blockedCount++;
            });

            const statTotal = document.getElementById('admin-stat-total');
            const statActive = document.getElementById('admin-stat-active');
            const statBlocked = document.getElementById('admin-stat-blocked');

            if (statTotal) statTotal.innerText = shops.length;
            if (statActive) statActive.innerText = activeCount;
            if (statBlocked) statBlocked.innerText = blockedCount;

            if (shops.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-500 font-bold">لا توجد صالات مسجلة حالياً. أضف صالة جديدة من الزر أعلاه.</td></tr>`;
                return;
            }

            tbody.innerHTML = shops.map(shop => {
                const isActive = shop.status === 'active';
                const statusBadge = isActive
                    ? `<span class="px-3 py-1 rounded-full text-[10px] font-bold bg-emeraldGlow/15 text-emeraldGlow border border-emeraldGlow/30">🟢 نشط</span>`
                    : `<span class="px-3 py-1 rounded-full text-[10px] font-bold bg-roseAlert/15 text-roseAlert border border-roseAlert/30">🔴 مجمد</span>`;

                const toggleBtn = isActive
                    ? `<button onclick="window.SaaS.toggleStatus('${shop.id}', 'blocked')" class="px-3 py-1.5 rounded-xl bg-amberWarn/15 hover:bg-amberWarn/30 text-amberWarn border border-amberWarn/30 text-xs font-bold transition-all" title="تجميد اشتراك الصالة">⏸ تجميد</button>`
                    : `<button onclick="window.SaaS.toggleStatus('${shop.id}', 'active')" class="px-3 py-1.5 rounded-xl bg-emeraldGlow/15 hover:bg-emeraldGlow/30 text-emeraldGlow border border-emeraldGlow/30 text-xs font-bold transition-all" title="تفعيل اشتراك الصالة">▶ تفعيل</button>`;

                return `
                    <tr class="hover:bg-white/5 transition-colors border-b border-white/5">
                        <td class="p-4 font-mono font-bold text-cyanGlow text-xs">${shop.id}</td>
                        <td class="p-4 font-bold text-white text-sm">${shop.name}</td>
                        <td class="p-4 font-mono text-gray-300 text-xs">${shop.passcode}</td>
                        <td class="p-4">${statusBadge}</td>
                        <td class="p-4 text-xs text-gray-400 font-mono">${shop.createdAt}</td>
                        <td class="p-4 flex items-center gap-2">
                            ${toggleBtn}
                            <button onclick="window.SaaS.enterShopAsAdmin('${shop.id}', '${shop.passcode}')" class="px-3 py-1.5 rounded-xl bg-violetApex/20 hover:bg-violetApex text-violetApex hover:text-white transition-all text-xs font-bold" title="دخول مباشر إلى هذه الصالة">دخول ➔</button>
                            <button onclick="window.SaaS.deleteShop('${shop.id}', '${shop.name}')" class="p-1.5 rounded-xl hover:bg-roseAlert/20 text-gray-500 hover:text-roseAlert transition-all text-xs" title="حذف الصالة نهائياً">🗑</button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-roseAlert font-bold">فشل جلب الصالات: ${err.message}</td></tr>`;
        }
    },

    // Toggle active / blocked status
    toggleStatus: async function(id, newStatus) {
        const actionLabel = newStatus === 'blocked' ? 'تجميد' : 'تفعيل';
        if (!confirm(`هل أنت متأكد من ${actionLabel} اشتراك هذه الصالة؟`)) return;

        try {
            await window.CloudDB.adminToggleShopStatus(id, newStatus);
            if (window.showToast) window.showToast(`تم ${actionLabel} الصالة بنجاح`, 'success');
            this.loadAdminShops();
        } catch (e) {
            alert('حدث خطأ: ' + e.message);
        }
    },

    // Open add shop modal
    openAddShopModal: function() {
        document.getElementById('new-shop-id').value = '';
        document.getElementById('new-shop-name').value = '';
        document.getElementById('new-shop-passcode').value = '';
        document.getElementById('modal-admin-add-shop').classList.remove('hidden');
    },

    closeAddShopModal: function() {
        document.getElementById('modal-admin-add-shop').classList.add('hidden');
    },

    // Confirm adding new shop
    confirmAddShop: async function() {
        const id = document.getElementById('new-shop-id').value.trim();
        const name = document.getElementById('new-shop-name').value.trim();
        const pass = document.getElementById('new-shop-passcode').value.trim();

        if (!id || !name || !pass) {
            alert('يرجى ملء جميع الحقول');
            return;
        }

        try {
            await window.CloudDB.adminCreateShop(id, name, pass);
            this.closeAddShopModal();
            if (window.showToast) window.showToast(`تم إنشاء صالة (${name}) بنجاح!`, 'success');
            this.loadAdminShops();
        } catch (e) {
            alert('فشل إنشاء الصالة: ' + e.message);
        }
    },

    // Enter shop directly as admin
    enterShopAsAdmin: async function(id, passcode) {
        this.closeAdminPortal();
        await window.CloudDB.loginShop(id, passcode);
    },

    // Delete shop permanently
    deleteShop: async function(id, name) {
        if (!confirm(`تحذير خطير: هل أنت متأكد من حذف صالة (${name}) وجميع بياناتها وفواتيرها نهائياً من السحابة؟`)) return;

        try {
            await window.CloudDB.adminDeleteShop(id);
            if (window.showToast) window.showToast('تم حذف الصالة وبياناتها نهائياً', 'error');
            this.loadAdminShops();
        } catch (e) {
            alert('فشل الحذف: ' + e.message);
        }
    }
};
