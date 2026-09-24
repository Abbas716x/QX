/**
 * 716QX SaaS UI Controller & Custom Dark Glassmorphism Modal System
 * High-end Dark Glassmorphism Modals for Alerts, Confirmations, and Prompts.
 * Completely replaces browser default alert/confirm/prompt.
 */
(function() {
    // Inject Custom Modals DOM if not already present
    function ensureModalDOM() {
        if (document.getElementById('modal-custom-confirm')) return;

        const container = document.createElement('div');
        container.id = 'custom-modals-root';
        container.innerHTML = `
            <!-- Custom Confirm Modal -->
            <div id="modal-custom-confirm" class="fixed inset-0 bg-obsidian/90 backdrop-blur-xl z-[900] hidden flex items-center justify-center p-4">
                <div class="glass-card w-full max-w-md p-6 sm:p-8 rounded-3xl relative border-t-4 border-violetApex shadow-2xl space-y-6 animate__animated animate__zoomIn animate__faster">
                    <div class="flex items-start gap-4">
                        <div id="custom-confirm-icon-box" class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shrink-0">
                            <span id="custom-confirm-icon">⚠️</span>
                        </div>
                        <div class="flex-1 space-y-1">
                            <h3 id="custom-confirm-title" class="text-lg font-black text-white font-ar">تأكيد العملية</h3>
                            <p id="custom-confirm-msg" class="text-xs text-gray-300 font-ar leading-relaxed">هل أنت متأكد من المتابعة؟</p>
                        </div>
                    </div>
                    <div class="flex gap-3 pt-2">
                        <button id="custom-confirm-cancel-btn" class="flex-1 py-3 rounded-xl font-bold text-xs text-gray-300 bg-white/5 hover:bg-white/10 transition-all border border-white/10 active:scale-95">
                            إلغاء
                        </button>
                        <button id="custom-confirm-ok-btn" class="flex-1 py-3 rounded-xl font-bold text-xs text-white glow-btn-primary transition-all active:scale-95">
                            نعم، متابعة
                        </button>
                    </div>
                </div>
            </div>

            <!-- Custom Alert Modal -->
            <div id="modal-custom-alert" class="fixed inset-0 bg-obsidian/90 backdrop-blur-xl z-[910] hidden flex items-center justify-center p-4">
                <div class="glass-card w-full max-w-sm p-6 sm:p-7 rounded-3xl relative border-t-4 border-cyanGlow shadow-2xl text-center space-y-5 animate__animated animate__zoomIn animate__faster">
                    <div id="custom-alert-icon-wrap" class="w-16 h-16 mx-auto rounded-3xl bg-cyanGlow/10 border border-cyanGlow/30 flex items-center justify-center text-3xl shadow-lg shadow-cyanGlow/20">
                        <span id="custom-alert-icon">ℹ️</span>
                    </div>
                    <div class="space-y-1">
                        <h3 id="custom-alert-title" class="text-lg font-black text-white font-ar">إشعار النظام</h3>
                        <p id="custom-alert-msg" class="text-xs text-gray-300 font-ar leading-relaxed px-2"></p>
                    </div>
                    <button id="custom-alert-ok-btn" class="w-full py-3.5 glow-btn-cyan rounded-xl font-black text-black text-xs transition-all active:scale-95">
                        حسناً، فهمت ➔
                    </button>
                </div>
            </div>

            <!-- Custom Prompt Modal -->
            <div id="modal-custom-prompt" class="fixed inset-0 bg-obsidian/90 backdrop-blur-xl z-[900] hidden flex items-center justify-center p-4">
                <div class="glass-card w-full max-w-md p-6 sm:p-8 rounded-3xl relative border-t-4 border-violetApex shadow-2xl space-y-5 animate__animated animate__zoomIn animate__faster">
                    <div class="space-y-1">
                        <h3 id="custom-prompt-title" class="text-lg font-black text-white font-ar">إدخال بيانات</h3>
                        <p id="custom-prompt-msg" class="text-xs text-gray-400 font-ar"></p>
                    </div>
                    <div>
                        <input id="custom-prompt-input" type="text" class="w-full bg-panelDark border border-white/10 rounded-xl p-3.5 outline-none focus:border-cyanGlow text-sm font-bold text-white transition-all">
                    </div>
                    <div class="flex gap-3 pt-2">
                        <button id="custom-prompt-cancel-btn" class="flex-1 py-3 rounded-xl font-bold text-xs text-gray-300 bg-white/5 hover:bg-white/10 transition-all border border-white/10 active:scale-95">
                            إلغاء
                        </button>
                        <button id="custom-prompt-ok-btn" class="flex-1 py-3 rounded-xl font-bold text-xs text-white glow-btn-primary transition-all active:scale-95">
                            تأكيد
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(container);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureModalDOM);
    } else {
        ensureModalDOM();
    }

    // Custom Dialog Manager
    window.CustomDialog = {
        confirm: function(options) {
            ensureModalDOM();
            return new Promise((resolve) => {
                if (typeof options === 'string') {
                    options = { message: options };
                }
                const modal = document.getElementById('modal-custom-confirm');
                const titleEl = document.getElementById('custom-confirm-title');
                const msgEl = document.getElementById('custom-confirm-msg');
                const okBtn = document.getElementById('custom-confirm-ok-btn');
                const cancelBtn = document.getElementById('custom-confirm-cancel-btn');
                const iconEl = document.getElementById('custom-confirm-icon');
                const iconBox = document.getElementById('custom-confirm-icon-box');

                if (!modal) {
                    resolve(true);
                    return;
                }

                if (titleEl) titleEl.innerText = options.title || 'تأكيد العملية';
                if (msgEl) msgEl.innerText = options.message || 'هل أنت متأكد من المتابعة؟';
                if (okBtn) okBtn.innerText = options.confirmText || 'نعم، استمرار';
                if (cancelBtn) cancelBtn.innerText = options.cancelText || 'إلغاء';

                if (okBtn) {
                    if (options.isDestructive) {
                        okBtn.className = 'flex-1 py-3 rounded-xl font-bold text-xs text-white bg-roseAlert hover:bg-roseAlert/90 shadow-lg shadow-roseAlert/30 transition-all active:scale-95 border border-roseAlert/50';
                        if (iconEl) iconEl.innerText = '⚠️';
                        if (iconBox) iconBox.className = 'w-12 h-12 rounded-2xl bg-roseAlert/10 border border-roseAlert/30 flex items-center justify-center text-2xl shrink-0 text-roseAlert';
                    } else {
                        okBtn.className = 'flex-1 py-3 rounded-xl font-bold text-xs text-white glow-btn-primary transition-all active:scale-95';
                        if (iconEl) iconEl.innerText = options.icon || '❓';
                        if (iconBox) iconBox.className = 'w-12 h-12 rounded-2xl bg-violetApex/10 border border-violetApex/30 flex items-center justify-center text-2xl shrink-0 text-violetApex';
                    }
                }

                const cleanup = () => {
                    modal.classList.add('hidden');
                    okBtn.removeEventListener('click', handleOk);
                    cancelBtn.removeEventListener('click', handleCancel);
                    document.removeEventListener('keydown', handleKey);
                };

                const handleOk = () => {
                    cleanup();
                    if (options.onConfirm) options.onConfirm();
                    resolve(true);
                };

                const handleCancel = () => {
                    cleanup();
                    if (options.onCancel) options.onCancel();
                    resolve(false);
                };

                const handleKey = (e) => {
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        handleCancel();
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        handleOk();
                    }
                };

                okBtn.addEventListener('click', handleOk);
                cancelBtn.addEventListener('click', handleCancel);
                document.addEventListener('keydown', handleKey);

                modal.classList.remove('hidden');
                if (window.AudioEngine && window.AudioEngine.play) window.AudioEngine.play('click');
            });
        },

        alert: function(options) {
            ensureModalDOM();
            return new Promise((resolve) => {
                if (typeof options === 'string') options = { message: options };
                const modal = document.getElementById('modal-custom-alert');
                const titleEl = document.getElementById('custom-alert-title');
                const msgEl = document.getElementById('custom-alert-msg');
                const iconEl = document.getElementById('custom-alert-icon');
                const iconWrap = document.getElementById('custom-alert-icon-wrap');
                const okBtn = document.getElementById('custom-alert-ok-btn');

                if (!modal) {
                    if (window.showToast) window.showToast(options.message, options.type === 'error' ? 'error' : 'success');
                    resolve();
                    return;
                }

                const isErr = options.type === 'error';
                const isSuccess = options.type === 'success';

                if (titleEl) titleEl.innerText = options.title || (isErr ? 'تنبيه خطأ' : (isSuccess ? 'عملية ناجحة' : 'إشعار النظام'));
                if (msgEl) msgEl.innerText = options.message || '';
                if (iconEl) iconEl.innerText = options.icon || (isErr ? '✕' : (isSuccess ? '✓' : 'ℹ️'));

                if (iconWrap) {
                    if (isErr) {
                        iconWrap.className = 'w-16 h-16 mx-auto rounded-3xl bg-roseAlert/15 border border-roseAlert/40 flex items-center justify-center text-3xl text-roseAlert shadow-lg shadow-roseAlert/30';
                    } else if (isSuccess) {
                        iconWrap.className = 'w-16 h-16 mx-auto rounded-3xl bg-emeraldGlow/15 border border-emeraldGlow/40 flex items-center justify-center text-3xl text-emeraldGlow shadow-lg shadow-emeraldGlow/30';
                    } else {
                        iconWrap.className = 'w-16 h-16 mx-auto rounded-3xl bg-cyanGlow/15 border border-cyanGlow/40 flex items-center justify-center text-3xl text-cyanGlow shadow-lg shadow-cyanGlow/30';
                    }
                }

                const cleanup = () => {
                    modal.classList.add('hidden');
                    okBtn.removeEventListener('click', handleClose);
                    document.removeEventListener('keydown', handleKey);
                };

                const handleClose = () => {
                    cleanup();
                    if (options.onClose) options.onClose();
                    resolve();
                };

                const handleKey = (e) => {
                    if (e.key === 'Escape' || e.key === 'Enter') {
                        e.preventDefault();
                        handleClose();
                    }
                };

                okBtn.addEventListener('click', handleClose);
                document.addEventListener('keydown', handleKey);
                modal.classList.remove('hidden');

                if (window.AudioEngine && window.AudioEngine.play) {
                    window.AudioEngine.play(isErr ? 'error' : (isSuccess ? 'success' : 'click'));
                }
            });
        },

        prompt: function(options) {
            ensureModalDOM();
            return new Promise((resolve) => {
                if (typeof options === 'string') options = { message: options };
                const modal = document.getElementById('modal-custom-prompt');
                const titleEl = document.getElementById('custom-prompt-title');
                const msgEl = document.getElementById('custom-prompt-msg');
                const inputEl = document.getElementById('custom-prompt-input');
                const okBtn = document.getElementById('custom-prompt-ok-btn');
                const cancelBtn = document.getElementById('custom-prompt-cancel-btn');

                if (!modal || !inputEl) {
                    resolve(null);
                    return;
                }

                if (titleEl) titleEl.innerText = options.title || 'إدخال بيانات';
                if (msgEl) msgEl.innerText = options.message || '';
                inputEl.value = options.defaultValue !== undefined ? options.defaultValue : '';
                inputEl.placeholder = options.placeholder || '';
                inputEl.type = options.inputType || 'text';

                const cleanup = () => {
                    modal.classList.add('hidden');
                    okBtn.removeEventListener('click', handleOk);
                    cancelBtn.removeEventListener('click', handleCancel);
                    document.removeEventListener('keydown', handleKey);
                };

                const handleOk = () => {
                    const val = inputEl.value;
                    cleanup();
                    if (options.onConfirm) options.onConfirm(val);
                    resolve(val);
                };

                const handleCancel = () => {
                    cleanup();
                    if (options.onCancel) options.onCancel();
                    resolve(null);
                };

                const handleKey = (e) => {
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        handleCancel();
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        handleOk();
                    }
                };

                okBtn.addEventListener('click', handleOk);
                cancelBtn.addEventListener('click', handleCancel);
                document.addEventListener('keydown', handleKey);

                modal.classList.remove('hidden');
                setTimeout(() => {
                    inputEl.focus();
                    inputEl.select();
                }, 60);

                if (window.AudioEngine && window.AudioEngine.play) window.AudioEngine.play('click');
            });
        }
    };

    // Public aliases
    window.showConfirmModal = (options) => window.CustomDialog.confirm(options);
    window.showAlertModal = (options) => window.CustomDialog.alert(options);
    window.showPromptModal = (options) => window.CustomDialog.prompt(options);

    // Override browser defaults cleanly
    window.alert = function(msg) {
        return window.CustomDialog.alert(msg);
    };

    // SaaS Controller for Shop Login & Operations
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
                    errEl.innerText = 'يرجى إدخال معرّف الصالة ورمز الدخول الخاص بك';
                    errEl.classList.remove('hidden');
                }
                return;
            }

            try {
                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = `<span class="inline-block animate-spin mr-2">🔄</span> جاري التحقق من الصالة والربط...`;
                }

                await window.CloudDB.loginShop(tenantId, passcode);
            } catch (err) {
                if (err.isBlocked) {
                    window.CloudDB.hideLoginModal();
                    window.CloudDB.showBlockedScreen(err.name);
                } else if (errEl) {
                    errEl.innerText = err.message || 'حدث خطأ أثناء تسجيل الدخول';
                    errEl.classList.remove('hidden');
                }
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerText = 'تسجيل الدخول والبدء ➔';
                }
            }
        },

        // Request logout with custom confirm dialog
        requestLogout: function() {
            window.showConfirmModal({
                title: 'تسجيل الخروج من الصالة',
                message: 'هل أنت متأكد من رغبتك بالخروج من الصالة الحالية أو التبديل لصالة أخرى؟',
                confirmText: 'نعم، تسجيل الخروج',
                cancelText: 'إلغاء التراجع',
                isDestructive: false,
                onConfirm: function() {
                    window.CloudDB.logoutShop();
                }
            });
        },

        // Request factory reset with custom confirm dialog
        requestResetSystem: function() {
            window.showConfirmModal({
                title: '⚠️ إعادة ضبط المصنع للنظام',
                message: 'تحذير أمان: سيتم مسح كافة الطاولات والفواتير والديون المحلية الخاصة بهذه الصالة بالكامل. هل أنت متأكد تماماً من المتابعة؟',
                confirmText: 'نعم، مسح وإعادة ضبط المصنع',
                cancelText: 'تراجع',
                isDestructive: true,
                onConfirm: function() {
                    window.resetSystemFull();
                }
            });
        }
    };
})();
