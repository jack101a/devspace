// ==UserScript==
// @name         Sarathi Auto Helper (MH + COVs + Clear)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Auto MH, Checkbox COVs, Clear Inputs
// @match        https://sarathi.parivahan.gov.in/sarathiservice/newLL_displayExpiredNewLL.do
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    console.log("%c🚀 Sarathi Auto Helper Script Loaded", "color:green;font-weight:bold;");

    // =====================================================
    // 0️⃣ CLEANUP NATIVE OR OLD CHECKBOXES
    // =====================================================
    const oldCopyBox = document.getElementById("copyPermToPres");
    if (oldCopyBox && oldCopyBox.parentElement) {
        oldCopyBox.parentElement.remove();
        console.log("🗑️ Removed copy-address checkbox");
    }

    // =====================================================
    // 1️⃣ AUTO-SELECT MAHARASHTRA
    // =====================================================
    function selectMaharashtra() {
        const select = document.querySelector('#presState, select[name="presState"]');
        if (!select || select.value === 'MH') return;

        let option = Array.from(select.options).find(opt =>
            opt.value === 'MH' || /maharashtra/i.test(opt.textContent)
        );

        if (!option) {
            option = new Option('Maharashtra', 'MH');
            option.className = 'bhashini-skip-translation';
            select.add(option);
        }

        select.value = 'MH';
        select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // =====================================================
    // 2️⃣ VEHICLE COV CHECKBOX CREATOR
    // =====================================================
    function initCOVCheckbox() {
        const selectBox = document.querySelector('#selectedCovsList, select[name="selectedCovsList"]');
        if (!selectBox || document.getElementById('cov-checkbox-panel')) return;

        const covOptions = [
             { short: "MCWG", full: "Motor Cycle with Gear(Non Transport) (MCWG)" },
             { short: "MCWOG", full: "Motor cycle without Gear (Non Transport) (MCWOG)" },
             { short: "LMV", full: "LIGHT MOTOR VEHICLE (LMV)" },
             { short: "LMV-TR", full: "LMV-TR(GOODS) (LMV-TR)" },
             { short: "3W-CAB", full: "LMV -3 Wheeler CAB (3W-CAB)" },
             { short: "3W-GV", full: "LMV -3 Wheeler Transport Goods Non PSV (3W-GV)" }
        ];

        let panel = document.createElement("div");
        panel.id = 'cov-checkbox-panel';
        panel.style.padding = "10px";
        panel.style.border = "1px solid #888";
        panel.style.marginBottom = "10px";
        panel.innerHTML = "<b>Select Vehicle Class:</b><br><br>";

        covOptions.forEach(item => {
            let id = "chk_" + item.short;

            let cb = document.createElement("input");
            cb.type = "checkbox";
            cb.id = id;
            cb.value = item.full;
            cb.style.accentColor = "red";

            let lbl = document.createElement("label");
            lbl.htmlFor = id;
            lbl.innerText = " " + item.short;
            lbl.style.color = "green";
            lbl.style.fontWeight = "bold";

            cb.addEventListener("change", function () {
                if (this.checked) {
                    let op = document.createElement("option");
                    op.value = item.full;
                    op.text = item.full;
                    op.selected = true;
                    selectBox.appendChild(op);
                } else {
                    [...selectBox.options].forEach(o => {
                        if (o.value === item.full) o.remove();
                    });
                }
                selectBox.dispatchEvent(new Event('change', { bubbles: true }));
            });

            panel.appendChild(cb);
            panel.appendChild(lbl);
            panel.appendChild(document.createElement("br"));
        });

        selectBox.parentNode.insertBefore(panel, selectBox);
    }

    // =====================================================
    // 3️⃣ DEFAULT GENDER MALE
    // =====================================================
    function setMaleDefault() {
        const male = document.querySelector('input[type="radio"][name="gender"][value="1"]');
        if (male && !male.checked) {
            male.checked = true;
            male.dispatchEvent(new Event("change", { bubbles: true }));
        }
    }

    // =====================================================
    // 4️⃣ OBSERVER FOR DYNAMIC ELEMENTS
    // =====================================================
    const observer = new MutationObserver(() => {
        selectMaharashtra();
        initCOVCheckbox();
        setMaleDefault();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 30000);

    // =====================================================
    // 5️⃣ AGGRESSIVE FIELD CLEAR & SET
    // =====================================================
    const toClear = [
        "fname", "mname", "lname",
        "swdfName", "swdmName", "swdlName",
        "presHouseNo", "presStreet", "presLocation", "presPinCode",
        "permHouseNo", "permStreet", "permLocation", "permPinCode",
        "newFullName", "idMarks1", "idMarks2" 
    ];

    const toSetValue = {
        "mobileNumber": "9999958678",
        "eduQual": "2" // This sets the dropdown to '8th Passed'
    };

    let clearAttempts = 0;

    // Helper to clear/set values and force the website to recognize the change
    function setAndTrigger(el, val) {
        el.value = val;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        
        // If Sarathi uses jQuery for Select2/Dropdowns, trigger it
        if (typeof window.jQuery !== 'undefined') {
            window.jQuery(el).trigger('change');
        }
        
        el.dataset.autoCleared = "true";
    }

    function scanAndProcess(doc) {
        toClear.forEach(id => {
            const el = doc.getElementById(id);
            if (el && !el.dataset.autoCleared) {
                if (el.value !== "" || clearAttempts > 5) {
                    setAndTrigger(el, "");
                }
            }
        });

        Object.keys(toSetValue).forEach(id => {
            const el = doc.getElementById(id);
            if (el && !el.dataset.autoCleared) {
                if (el.value !== toSetValue[id] || clearAttempts > 5) {
                    setAndTrigger(el, toSetValue[id]);
                }
            }
        });
    }

    // Run every 500ms for 10 seconds straight
    const clearTimer = setInterval(() => {
        clearAttempts++;
        
        scanAndProcess(document);
        
        // Look inside iframes just in case
        document.querySelectorAll("iframe").forEach(f => {
            try { if (f.contentDocument) scanAndProcess(f.contentDocument); } catch (e) {}
        });

        // Stop checking after 10 seconds (20 attempts)
        if (clearAttempts >= 20) {
            clearInterval(clearTimer);
            console.log("🎯 Auto-Clear sequence complete.");
        }
    }, 500);

    // =====================================================
    // 6️⃣ FORCE UPPERCASE TEXT INPUTS (EXCEPT CAPTCHA)
    // =====================================================
    document.addEventListener('input', function (e) {
        // Target text input fields, but EXCLUDE the Captcha field (id="entcaptxt")
        if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'text' && e.target.id !== 'entcaptxt') {
            
            // Check if there is any lowercase text to convert
            if (/[a-z]/.test(e.target.value)) {
                // Save the current cursor position to prevent it from jumping to the end
                let start = e.target.selectionStart;
                let end = e.target.selectionEnd;

                // Convert to uppercase
                e.target.value = e.target.value.toUpperCase();

                // Restore cursor position safely
                try {
                    e.target.setSelectionRange(start, end);
                } catch (err) {
                    // Ignore errors on input types that don't support selectionRange
                }
            }
        }
    }, true); 

})();
