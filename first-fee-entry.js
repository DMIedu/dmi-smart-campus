/**
 * First Fee Entry Modal — shared across scanner, lab-booking, class-book
 *
 * USAGE inside any of those pages:
 *   <script src="first-fee-entry.js"></script>
 *
 *   When a scan/booking result contains { feeStatus: { needsFirstFeeEntry: true } },
 *   call:
 *      window.showFirstFeeEntryModal(feeStatus, onDoneCallback)
 *
 *   The modal handles course confirmation + opening balance entry.
 *   On success it calls onDoneCallback(result) and closes.
 */
(function () {
  const OVERLAY_ID = 'ffe-overlay';

  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function ensureOverlay() {
    let el = document.getElementById(OVERLAY_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = OVERLAY_ID;
    el.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.7);backdrop-filter:blur(4px);z-index:2000;display:none;align-items:center;justify-content:center;padding:1rem;';
    document.body.appendChild(el);
    return el;
  }

  window.showFirstFeeEntryModal = function (feeStatus, onDone) {
    const info = feeStatus.firstFeeEntry;
    if (!info || !info.tracked) {
      alert('Student not in fees system yet — please sync students first.');
      if (onDone) onDone({ success: false, cancelled: true });
      return;
    }
    const courses = info.allCourses || [];
    const suggestedId = info.suggestedCourseId;

    const overlay = ensureOverlay();
    overlay.innerHTML = '';

    const courseOptions = courses.map(c => {
      const total = Number(c.TotalFee) + Number(c.RegistrationFee || 0);
      return '<option value="' + esc(c.CourseID) + '"' +
        (c.CourseID === suggestedId ? ' selected' : '') + '>' +
        esc(c.CourseName) + ' — Rs. ' + total.toLocaleString() +
        (Number(c.RegistrationFee) > 0 ? ' (incl. reg)' : '') +
        '</option>';
    }).join('');

    overlay.innerHTML =
      '<div style="background:white;border-radius:16px;max-width:520px;width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 25px 60px rgba(0,0,0,0.35);">' +
      '<div style="padding:1.25rem 1.5rem;border-bottom:1px solid #e2e8f0;">' +
        '<div style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:800;font-size:1.125rem;color:#166534;">🎓 First Fee Entry</div>' +
        '<div style="font-size:0.8125rem;color:#64748b;margin-top:2px;">' + esc(info.studentName) + ' · ' + esc(info.registrationNumber) + '</div>' +
        (info.suggestedCourseName ? '<div style="font-size:0.75rem;color:#059669;margin-top:4px;">💡 Auto-detected: ' + esc(info.suggestedCourseName) + '</div>' : '') +
      '</div>' +
      '<div style="padding:1.25rem 1.5rem;">' +
        '<div style="padding:0.625rem 0.875rem;border-radius:8px;background:#fef3c7;color:#78350f;font-size:0.75rem;margin-bottom:1rem;">' +
          '⚠️ This student is NOT in the fees system yet. Enter their opening balance below to set them up. This happens once per student.' +
        '</div>' +
        '<label style="display:block;font-size:0.75rem;font-weight:600;color:#64748b;margin-bottom:4px;text-transform:uppercase;">Course *</label>' +
        '<select id="ffe-course" style="width:100%;padding:0.5rem 0.75rem;border:1px solid #e2e8f0;border-radius:8px;font-size:0.875rem;font-family:inherit;margin-bottom:0.875rem;" onchange="window._ffeUpdatePreview()">' +
          '<option value="">Select course...</option>' +
          courseOptions +
        '</select>' +
        '<div id="ffe-preview" style="padding:0.75rem;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:8px;font-size:0.8125rem;margin-bottom:0.875rem;display:none;"></div>' +
        '<label style="display:block;font-size:0.75rem;font-weight:600;color:#64748b;margin-bottom:4px;text-transform:uppercase;">Amount Already Paid (Rs.) *</label>' +
        '<input type="number" id="ffe-amount" min="0" step="0.01" value="0" style="width:100%;padding:0.5rem 0.75rem;border:1px solid #e2e8f0;border-radius:8px;font-size:1.125rem;font-family:inherit;font-weight:700;margin-bottom:0.5rem;">' +
        '<div style="font-size:0.6875rem;color:#64748b;margin-bottom:0.875rem;">Ask the student. If truly nothing paid yet, enter 0.</div>' +
        '<label style="display:block;font-size:0.75rem;font-weight:600;color:#64748b;margin-bottom:4px;text-transform:uppercase;">Start / Enrollment Date</label>' +
        '<input type="date" id="ffe-start" style="width:100%;padding:0.5rem 0.75rem;border:1px solid #e2e8f0;border-radius:8px;font-size:0.875rem;font-family:inherit;margin-bottom:0.875rem;">' +
        '<div id="ffe-error" style="display:none;padding:0.625rem 0.875rem;border-radius:8px;background:#fee2e2;color:#991b1b;font-size:0.8125rem;margin-bottom:0.5rem;"></div>' +
      '</div>' +
      '<div style="padding:1rem 1.5rem;border-top:1px solid #e2e8f0;display:flex;gap:0.5rem;justify-content:flex-end;">' +
        '<button id="ffe-cancel" style="background:white;border:1px solid #e2e8f0;color:#0f172a;padding:0.5rem 1rem;border-radius:8px;font-weight:600;cursor:pointer;">Cancel</button>' +
        '<button id="ffe-save" style="background:#166534;color:white;border:none;padding:0.5rem 1.25rem;border-radius:8px;font-weight:700;cursor:pointer;">💾 Save &amp; Continue</button>' +
      '</div>' +
      '</div>';

    overlay.style.display = 'flex';
    document.getElementById('ffe-start').value = new Date().toISOString().split('T')[0];

    window._ffeUpdatePreview = function () {
      const cid = document.getElementById('ffe-course').value;
      const c = courses.find(x => x.CourseID === cid);
      const box = document.getElementById('ffe-preview');
      if (!c) { box.style.display = 'none'; return; }
      const reg = Number(c.RegistrationFee || 0);
      const total = Number(c.TotalFee) + reg;
      box.style.display = 'block';
      box.innerHTML =
        '📚 <b>' + esc(c.CourseName) + '</b><br>' +
        '💰 Course Fee: Rs. ' + Number(c.TotalFee).toLocaleString() +
        (reg > 0 ? ' + 📝 Registration: Rs. ' + reg.toLocaleString() + ' = <b>Rs. ' + total.toLocaleString() + '</b>' : '') + '<br>' +
        '📅 ' + c.InstallmentCount + ' installments · every ' + c.DaysBetween + ' days';
    };
    window._ffeUpdatePreview();

    document.getElementById('ffe-cancel').onclick = function () {
      overlay.style.display = 'none';
      if (onDone) onDone({ success: false, cancelled: true });
    };

    document.getElementById('ffe-save').onclick = async function () {
      const courseId = document.getElementById('ffe-course').value;
      const amountRaw = document.getElementById('ffe-amount').value;
      const amount = parseFloat(amountRaw);
      const startDate = document.getElementById('ffe-start').value;
      const err = document.getElementById('ffe-error');
      err.style.display = 'none';

      if (!courseId) { err.textContent = 'Please select a course'; err.style.display = 'block'; return; }
      if (amountRaw === '' || isNaN(amount) || amount < 0) {
        err.textContent = 'Enter amount already paid (0 or more)'; err.style.display = 'block'; return;
      }
      const btn = document.getElementById('ffe-save');
      btn.disabled = true; btn.textContent = 'Saving...';
      const result = await window.apiCall('submitFirstFeeEntry', {
        registrationNumber: info.registrationNumber,
        courseId, amountAlreadyPaid: amount, startDate
      });
      btn.disabled = false; btn.textContent = '💾 Save & Continue';
      if (result && result.success) {
        overlay.style.display = 'none';
        if (onDone) onDone(result);
      } else {
        err.textContent = (result && result.error) || 'Failed to save';
        err.style.display = 'block';
      }
    };
  };
})();
