// Configuration - Supabase Root URL
const SUPABASE_URL = 'https://japonmagnijoatupwawe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcG9ubWFnbmlqb2F0dXB3YXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MzI4MTIsImV4cCI6MjEwNDEwODgxMn0.uVEzzBHb8Qqq9UPgJQfzt0y5U6x8qv5DPjAPzTroK-8';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let formsCache = [];
let editingFormIndex = null;

// Initialize App (Instant Load)
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const fillFormId = urlParams.get('fill');

  if (fillFormId) {
    document.getElementById('main-header').style.display = 'none';
    loadAndRenderFiller(fillFormId);
    return;
  }
  
  // Render home UI immediately so buttons click right away
  renderHomeView();
  // Fetch database records in the background
  fetchAllForms();
});

});

// Fetch All Forms & Responses from Supabase
async function fetchAllForms() {
  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="card"><p style="text-align:center;">Loading forms...</p></div>`;

  const { data: forms, error } = await supabase
    .from('forms')
    .select('*, responses(*)');

  if (error) {
    alert('Error loading forms: ' + error.message);
    main.innerHTML = `<div class="card"><p style="text-align:center; color:#dc2626;">Failed to load forms. Click "+ Create form" above to start.</p></div>`;
    return;
  }

  formsCache = forms || [];
  renderHomeView();
}

// Render Admin Dashboard View
function renderHomeView() {
  const main = document.getElementById('main-content');
  document.getElementById('main-header').style.display = 'block';

  if (formsCache.length === 0) {
    main.innerHTML = `<div class="card"><p style="text-align:center; color:#7f8c8d;">No forms created yet. Click "+ Create form" above to start.</p></div>`;
    return;
  }

  let html = formsCache.map((form, index) => `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <h3 style="font-size:18px; font-weight:700;">${escapeHtml(form.title)}</h3>
          <p style="font-size:12px; color:#7f8c8d; margin-top:4px;">${new Date(form.created_at).toLocaleDateString()}</p>
        </div>
        <div class="action-links">
          <a href="#" onclick="showFormBuilder(${index})">Edit</a>
          <a href="#" onclick="openFormFillerLocally(${index})">Fill</a>
          <a href="#" onclick="shareFormLink(${form.id})">Share</a>
          <a href="#" onclick="viewResponses(${index})">Responses (${form.responses ? form.responses.length : 0})</a>
          <a href="#" style="color:#dc2626;" onclick="deleteForm(${form.id})">Delete</a>
        </div>
      </div>
    </div>
  `).join('');

  main.innerHTML = html;
}

// Delete Form from Cloud Database
async function deleteForm(formId) {
  if (confirm('Are you sure you want to delete this form? All responses will also be deleted.')) {
    const { error } = await supabase.from('forms').delete().eq('id', formId);
    if (error) {
      alert('Delete failed: ' + error.message);
      return;
    }
    await fetchAllForms();
  }
}

// Form Builder UI
function showFormBuilder(editIndex = null) {
  editingFormIndex = editIndex;
  const isEditing = editIndex !== null;
  const formToEdit = isEditing ? formsCache[editIndex] : null;

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="card">
      <h2 style="margin-bottom:15px;">${isEditing ? 'Edit form' : 'Create form'}</h2>
      <input type="text" id="form-title" class="form-control" placeholder="Form title" value="${isEditing ? escapeHtml(formToEdit.title) : ''}" style="font-size:16px; font-weight:600;" required>
      <input type="text" id="form-desc" class="form-control" placeholder="Description (optional)" value="${isEditing ? escapeHtml(formToEdit.description) : ''}">
    </div>

    <div id="fields-container"></div>

    <button class="action-btn" style="background:#e5e7eb; color:#374151; margin-bottom:12px;" onclick="addFieldSector()">+ Add sector / field</button>
    <button class="action-btn" onclick="saveFormSchema()">${isEditing ? 'Update form' : 'Save form'}</button>
  `;

  if (isEditing && formToEdit.fields && formToEdit.fields.length > 0) {
    formToEdit.fields.forEach(field => addFieldSector(field));
  } else {
    addFieldSector();
  }
}

function addFieldSector(existingData = null) {
  const container = document.getElementById('fields-container');
  const fieldId = existingData ? existingData.id : 'field_' + Date.now() + Math.random().toString(36).substring(2, 5);

  const sectorDiv = document.createElement('div');
  sectorDiv.className = 'sector-item';
  sectorDiv.id = `sector-${fieldId}`;
  sectorDiv.setAttribute('data-field-id', fieldId);
  
  const selectedType = existingData ? existingData.type : 'short';
  const selectedTrigger = existingData ? existingData.trigger : 'none';
  const optionsVal = existingData && existingData.options ? existingData.options.join(', ') : '';

  const showOptions = ['dropdown', 'radio', 'checkbox_multi', 'scale'].includes(selectedType);

  sectorDiv.innerHTML = `
    <div style="display:flex; gap:10px;">
      <input type="text" class="form-control field-label" placeholder="Field label (e.g. Full Name)" value="${existingData ? escapeHtml(existingData.label) : ''}" style="flex:2;">
      <select class="form-control field-type" style="flex:1;" onchange="handleTypeChange('${fieldId}', this.value)">
        <option value="short" ${selectedType === 'short' ? 'selected' : ''}>Short text</option>
        <option value="paragraph" ${selectedType === 'paragraph' ? 'selected' : ''}>Paragraph</option>
        <option value="dropdown" ${selectedType === 'dropdown' ? 'selected' : ''}>Dropdown</option>
        <option value="radio" ${selectedType === 'radio' ? 'selected' : ''}>Multiple choice</option>
        <option value="checkbox_multi" ${selectedType === 'checkbox_multi' ? 'selected' : ''}>Checkboxes (multi-select)</option>
        <option value="checkbox" ${selectedType === 'checkbox' ? 'selected' : ''}>Single checkbox</option>
        <option value="date" ${selectedType === 'date' ? 'selected' : ''}>Date</option>
        <option value="time" ${selectedType === 'time' ? 'selected' : ''}>Time</option>
        <option value="scale" ${selectedType === 'scale' ? 'selected' : ''}>Linear scale</option>
      </select>
    </div>

    <div id="options-container-${fieldId}" class="${showOptions ? '' : 'hidden'}" style="margin-bottom:10px;">
      <input type="text" class="form-control field-options" placeholder="Options separated by comma (e.g. Male, Female)" value="${escapeHtml(optionsVal)}">
    </div>

    <div class="trigger-container">
      <span style="font-weight:400; font-size:14px; color:#374151;">Print</span>
      <input type="number" class="trigger-select field-trigger" min="0" max="20" placeholder="Col #" value="${selectedTrigger !== 'none' ? selectedTrigger : ''}" style="width:75px; opacity:0.65; color:#6b7280;">
      <button style="margin-left:auto; color:#dc2626; background:none; border:none; cursor:pointer;" onclick="document.getElementById('sector-${fieldId}').remove()">Remove</button>
    </div>
  `;

  container.appendChild(sectorDiv);
}

function handleTypeChange(fieldId, type) {
  const optContainer = document.getElementById(`options-container-${fieldId}`);
  if (['dropdown', 'radio', 'checkbox_multi', 'scale'].includes(type)) {
    optContainer.classList.remove('hidden');
  } else {
    optContainer.classList.add('hidden');
  }
}

// Save or Update Form in Supabase
async function saveFormSchema() {
  const title = document.getElementById('form-title').value.trim();
  const description = document.getElementById('form-desc').value.trim();

  if (!title) {
    alert('Please enter a form title');
    return;
  }

  const sectorElements = document.querySelectorAll('.sector-item');
  const fields = [];

  sectorElements.forEach(el => {
    const label = el.querySelector('.field-label').value.trim();
    const type = el.querySelector('.field-type').value;
    const triggerVal = el.querySelector('.field-trigger').value.trim();
    const optionsVal = el.querySelector('.field-options') ? el.querySelector('.field-options').value : '';
    const fieldId = el.getAttribute('data-field-id') || ('field_' + Date.now() + Math.random().toString(36).substring(2, 5));

    if (label) {
      fields.push({
        id: fieldId,
        label,
        type,
        trigger: triggerVal ? triggerVal : 'none',
        options: optionsVal ? optionsVal.split(',').map(o => o.trim()).filter(Boolean) : []
      });
    }
  });

  let savedFormId;

  if (editingFormIndex !== null) {
    const targetForm = formsCache[editingFormIndex];
    const { error } = await supabase
      .from('forms')
      .update({ title, description, fields })
      .eq('id', targetForm.id);

    if (error) {
      alert('Error updating form: ' + error.message);
      return;
    }
    savedFormId = targetForm.id;
  } else {
    const { data, error } = await supabase
      .from('forms')
      .insert([{ title, description, fields }])
      .select();

    if (error) {
      alert('Error saving form: ' + error.message);
      return;
    }
    savedFormId = data[0].id;
  }

  editingFormIndex = null;
  await fetchAllForms();
  displayShareModal(savedFormId);
}

// Modal displaying generated link
function displayShareModal(formId) {
  const shareUrl = `${window.location.origin}${window.location.pathname}?fill=${formId}`;
  
  const modalDiv = document.createElement('div');
  modalDiv.style.position = 'fixed';
  modalDiv.style.top = '0';
  modalDiv.style.left = '0';
  modalDiv.style.width = '100vw';
  modalDiv.style.height = '100vh';
  modalDiv.style.background = 'rgba(0,0,0,0.5)';
  modalDiv.style.display = 'flex';
  modalDiv.style.alignItems = 'center';
  modalDiv.style.justifyContent = 'center';
  modalDiv.style.zIndex = '9999';

  modalDiv.innerHTML = `
    <div style="background:white; padding:24px; border-radius:12px; max-width:480px; width:90%; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
      <h3 style="margin-bottom:10px; color:#2e7d32;">Form Saved to Cloud!</h3>
      <p style="font-size:14px; color:#4b5563; margin-bottom:14px;">Copy and share this public link with responders. They will only see the form filler page:</p>
      <input type="text" readonly value="${shareUrl}" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:6px; font-size:13px; margin-bottom:14px;">
      <div style="display:flex; gap:10px;">
        <button class="action-btn" style="margin-top:0;" onclick="navigator.clipboard.writeText('${shareUrl}'); alert('Link copied to clipboard!');">Copy Link</button>
        <button class="action-btn" style="margin-top:0; background:#6b7280;" onclick="this.closest('div').parentElement.parentElement.remove()">Done</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalDiv);
}

// Load Public Filler View
async function loadAndRenderFiller(formId) {
  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="card"><p style="text-align:center;">Loading form...</p></div>`;

  const { data: form, error } = await supabase
    .from('forms')
    .select('*')
    .eq('id', formId)
    .single();

  if (error || !form) {
    main.innerHTML = `<div class="card"><p style="color:#dc2626; text-align:center;">Form not found or link has expired.</p></div>`;
    return;
  }

  renderFormFillerUI(form, true);
}

function openFormFillerLocally(index) {
  renderFormFillerUI(formsCache[index], false);
}

function renderFormFillerUI(form, isPublic) {
  const main = document.getElementById('main-content');

  let fieldsHTML = form.fields.map(field => {
    let inputHTML = '';
    const placeholderText = escapeHtml(field.label);

    if (field.type === 'short') {
      inputHTML = `<input type="text" name="${field.id}" class="form-control" placeholder="${placeholderText}" required>`;
    } else if (field.type === 'paragraph') {
      inputHTML = `<textarea name="${field.id}" class="form-control" rows="3" placeholder="${placeholderText}"></textarea>`;
    } else if (field.type === 'date') {
      inputHTML = `<input type="text" onfocus="(this.type='date')" onblur="if(!this.value)this.type='text'" name="${field.id}" class="form-control" placeholder="${placeholderText}" required>`;
    } else if (field.type === 'time') {
      inputHTML = `<input type="text" onfocus="(this.type='time')" onblur="if(!this.value)this.type='text'" name="${field.id}" class="form-control" placeholder="${placeholderText}" required>`;
    } else if (field.type === 'dropdown') {
      const opts = field.options.length > 0 ? field.options : ['Option 1'];
      inputHTML = `
        <select name="${field.id}" class="form-control" required>
          <option value="" disabled selected>${placeholderText}</option>
          ${opts.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('')}
        </select>
      `;
    } else if (field.type === 'scale') {
      const opts = field.options.length > 0 ? field.options : ['1', '2', '3', '4', '5'];
      inputHTML = `
        <label style="font-size:14px; font-weight:600; display:block; margin-bottom:6px;">${placeholderText}</label>
        <select name="${field.id}" class="form-control" required>
          <option value="" disabled selected>Select Rating</option>
          ${opts.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('')}
        </select>
      `;
    } else if (field.type === 'radio') {
      const opts = field.options.length > 0 ? field.options : ['Option 1'];
      inputHTML = `
        <label style="font-size:14px; font-weight:600; display:block; margin-bottom:6px;">${placeholderText}</label>
        ${opts.map(o => `
          <label style="display:block; margin-bottom:4px; font-size:14px;">
            <input type="radio" name="${field.id}" value="${escapeHtml(o)}"> ${escapeHtml(o)}
          </label>
        `).join('')}
      `;
    } else if (field.type === 'checkbox_multi') {
      const opts = field.options.length > 0 ? field.options : ['Option 1'];
      inputHTML = `
        <label style="font-size:14px; font-weight:600; display:block; margin-bottom:6px;">${placeholderText}</label>
        ${opts.map(o => `
          <label style="display:block; margin-bottom:4px; font-size:14px;">
            <input type="checkbox" name="${field.id}" value="${escapeHtml(o)}"> ${escapeHtml(o)}
          </label>
        `).join('')}
      `;
    } else if (field.type === 'checkbox') {
      inputHTML = `<label style="font-size:14px;"><input type="checkbox" name="${field.id}" value="True"> ${placeholderText}</label>`;
    }

    return `<div style="margin-bottom:14px;">${inputHTML}</div>`;
  }).join('');

  main.innerHTML = `
    <div class="card">
      <h2 style="margin-bottom:6px;">${escapeHtml(form.title)}</h2>
      <p style="color:#7f8c8d; font-size:14px; margin-bottom:16px;">${escapeHtml(form.description)}</p>
      <form id="submission-form" onsubmit="handleFormSubmit(event, ${form.id}, ${isPublic})">
        ${fieldsHTML}
        <button type="submit" class="action-btn">Submit</button>
      </form>
    </div>
  `;
}

// Submit Response directly to Supabase
async function handleFormSubmit(event, formId, isPublic) {
  event.preventDefault();
  const formElement = event.target;
  const formData = new FormData(formElement);
  
  let formObj = formsCache.find(f => String(f.id) === String(formId));

  if (!formObj) {
    const { data } = await supabase.from('forms').select('*').eq('id', formId).single();
    formObj = data;
  }

  const answers = {};

  if (formObj && formObj.fields) {
    formObj.fields.forEach(field => {
      if (field.type === 'checkbox_multi') {
        const selected = formData.getAll(field.id);
        answers[field.id] = selected.length > 0 ? selected.join('/') : 'N/A';
      } else {
        answers[field.id] = formData.get(field.id) || 'N/A';
      }
    });
  }

  const { error } = await supabase
    .from('responses')
    .insert([{ form_id: formId, answers }]);

  if (error) {
    alert('Submission failed: ' + error.message);
    return;
  }

  if (isPublic) {
    document.getElementById('main-content').innerHTML = `
      <div class="card" style="text-align:center; padding:30px;">
        <h2 style="color:#2e7d32;">Thank You!</h2>
        <p style="margin-top:10px; color:#4b5563;">Your response has been submitted successfully.</p>
      </div>
    `;
  } else {
    alert('Response submitted successfully!');
    await fetchAllForms();
  }
}

function shareFormLink(formId) {
  const shareUrl = `${window.location.origin}${window.location.pathname}?fill=${formId}`;
  navigator.clipboard.writeText(shareUrl).then(() => {
    alert('Form share link copied to clipboard!\n\n' + shareUrl);
  }).catch(() => {
    prompt('Copy this link to share your form:', shareUrl);
  });
}

// View Filtered Responses
function viewResponses(index) {
  window.currentViewingFormIndex = index;
  renderResponsesList(formsCache[index], '');
}

function renderResponsesList(form, searchQuery = '') {
  const main = document.getElementById('main-content');

  if (!form.responses || form.responses.length === 0) {
    main.innerHTML = `
      <div class="card">
        <h2>${escapeHtml(form.title)}</h2>
        <p style="margin-top:10px; color:#7f8c8d;">No responses recorded yet.</p>
        <button class="action-btn" style="background:#6b7280; margin-top:15px;" onclick="renderHomeView()">Back to Home</button>
      </div>
    `;
    return;
  }

  const query = searchQuery.toLowerCase().trim();

  const filteredResponses = form.responses.filter(resp => {
    if (!query) return true;
    return form.fields.some(field => {
      const answerVal = String(resp.answers[field.id] || '').toLowerCase();
      return answerVal.includes(query);
    });
  });

  let responsesHTML = filteredResponses.map((resp, rIndex) => {
    let answersList = form.fields.map(field => `
      <div class="response-group">
        <div class="question-label-normal">${escapeHtml(field.label)}</div>
        <div class="answer-value-bold">${escapeHtml(resp.answers[field.id] || 'N/A')}</div>
      </div>
    `).join('');

    return `
      <div class="card">
        <div style="font-size:12px; color:#7f8c8d; margin-bottom:12px; border-bottom:1px solid #eee; padding-bottom:6px;">
          Response #${rIndex + 1} &bull; ${new Date(resp.submitted_at).toLocaleString()}
        </div>
        ${answersList}
      </div>
    `;
  }).join('');

  main.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <h2>${escapeHtml(form.title)}</h2>
      <button class="btn-create" style="background:#059669;" onclick="generatePDFReport(${window.currentViewingFormIndex})">Export PDF</button>
    </div>

    <div style="margin-bottom:16px;">
      <input type="text" id="response-search" class="form-control" placeholder="Search/Filter answers..." value="${escapeHtml(searchQuery)}" oninput="filterResponses(this.value)">
    </div>

    ${filteredResponses.length > 0 ? responsesHTML : '<div class="card"><p style="color:#7f8c8d;">No matching responses found.</p></div>'}
    
    <button class="action-btn" style="background:#6b7280; margin-top:10px;" onclick="renderHomeView()">Back to Home</button>
  `;
}

function filterResponses(query) {
  renderResponsesList(formsCache[window.currentViewingFormIndex], query);
}

// Generate PDF Report
function generatePDFReport(index) {
  const form = formsCache[index];
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const triggeredFields = form.fields
    .filter(f => f.trigger !== 'none' && !isNaN(parseInt(f.trigger)))
    .sort((a, b) => parseInt(a.trigger) - parseInt(b.trigger));

  const fieldsToExport = triggeredFields.length > 0 ? triggeredFields : form.fields;

  const tableHeaders = ['S/N', ...fieldsToExport.map(f => f.label)];
  tableHeaders.push('Submitted At');

  const tableData = form.responses.map((resp, idx) => [
    idx + 1,
    ...fieldsToExport.map(f => resp.answers[f.id] || ''),
    new Date(resp.submitted_at).toLocaleString()
  ]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(form.title, 105, 20, { align: 'center' });

  doc.autoTable({
    startY: 30,
    head: [tableHeaders],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 4 }
  });

  doc.save(`${form.title.replace(/\s+/g, '_')}_Report.pdf`);
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
