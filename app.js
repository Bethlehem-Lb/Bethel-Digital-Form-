// State Management
let forms = JSON.parse(localStorage.getItem('bethle_forms')) || [];
let editingFormIndex = null;

// Initialize App & Handle Direct Share Link
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const fillFormId = urlParams.get('fill');

  if (fillFormId) {
    const targetIndex = forms.findIndex(f => String(f.id) === String(fillFormId));
    if (targetIndex !== -1) {
      document.getElementById('main-header').style.display = 'none'; // Hide Admin Header for Filler
      openFormFiller(targetIndex, true);
      return;
    }
  }
  renderHomeView();
});

// Render Home View (Admin Dashboard)
function renderHomeView() {
  const main = document.getElementById('main-content');
  document.getElementById('main-header').style.display = 'block';

  if (forms.length === 0) {
    main.innerHTML = `<div class="card"><p style="text-align:center; color:#7f8c8d;">No forms created yet. Click "+ Create form" above to start.</p></div>`;
    return;
  }

  let html = forms.map((form, index) => `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <h3 style="font-size:18px; font-weight:700;">${escapeHtml(form.title)}</h3>
          <p style="font-size:12px; color:#7f8c8d; margin-top:4px;">${form.createdAt}</p>
        </div>
        <div class="action-links">
          <a href="#" onclick="showFormBuilder(${index})">Edit</a>
          <a href="#" onclick="openFormFiller(${index})">Fill</a>
          <a href="#" onclick="shareFormLink(${form.id})">Share</a>
          <a href="#" onclick="viewResponses(${index})">Responses (${form.responses ? form.responses.length : 0})</a>
        </div>
      </div>
    </div>
  `).join('');

  main.innerHTML = html;
}

// Show Form Builder (Supports Create & Edit)
function showFormBuilder(editIndex = null) {
  editingFormIndex = editIndex;
  const isEditing = editIndex !== null;
  const formToEdit = isEditing ? forms[editIndex] : null;

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

  if (isEditing && formToEdit.fields.length > 0) {
    formToEdit.fields.forEach(field => addFieldSector(field));
  } else {
    addFieldSector();
  }
}

// Add Dynamic Field Sector with Unlimited Column Print Triggers
function addFieldSector(existingData = null) {
  const container = document.getElementById('fields-container');
  const fieldId = existingData ? existingData.id : Date.now() + Math.random().toString(36).substring(2, 5);

  const sectorDiv = document.createElement('div');
  sectorDiv.className = 'sector-item';
  sectorDiv.id = `sector-${fieldId}`;
  
  const selectedType = existingData ? existingData.type : 'short';
  const selectedTrigger = existingData ? existingData.trigger : 'none';
  const optionsVal = existingData ? existingData.options.join(', ') : '';

  sectorDiv.innerHTML = `
    <div style="display:flex; gap:10px;">
      <input type="text" class="form-control field-label" placeholder="Field label (e.g. Full Name)" value="${existingData ? escapeHtml(existingData.label) : ''}" style="flex:2;">
      <select class="form-control field-type" style="flex:1;" onchange="handleTypeChange('${fieldId}', this.value)">
        <option value="short" ${selectedType === 'short' ? 'selected' : ''}>Short text</option>
        <option value="paragraph" ${selectedType === 'paragraph' ? 'selected' : ''}>Paragraph</option>
        <option value="dropdown" ${selectedType === 'dropdown' ? 'selected' : ''}>Dropdown</option>
        <option value="scale" ${selectedType === 'scale' ? 'selected' : ''}>Linear Scale / Ratio (7/10)</option>
        <option value="checkbox" ${selectedType === 'checkbox' ? 'selected' : ''}>Single Checkbox</option>
      </select>
    </div>

    <div id="options-container-${fieldId}" class="${(selectedType === 'dropdown' || selectedType === 'scale') ? '' : 'hidden'}" style="margin-bottom:10px;">
      <input type="text" class="form-control field-options" placeholder="Options separated by comma (e.g. Male, Female)" value="${escapeHtml(optionsVal)}">
    </div>

    <div class="trigger-container">
      <label style="font-weight:600;">Print Trigger Column:</label>
      <input type="number" class="trigger-select field-trigger" min="0" max="20" placeholder="Col #" value="${selectedTrigger !== 'none' ? selectedTrigger : ''}" style="width:70px;">
      <span style="font-size:11px; color:#6b7280;">(Enter 1, 2, 3... or leave empty)</span>
      <button style="margin-left:auto; color:#dc2626; background:none; border:none; cursor:pointer;" onclick="document.getElementById('sector-${fieldId}').remove()">Remove</button>
    </div>
  `;

  container.appendChild(sectorDiv);
}

function handleTypeChange(fieldId, type) {
  const optContainer = document.getElementById(`options-container-${fieldId}`);
  if (type === 'dropdown' || type === 'scale') {
    optContainer.classList.remove('hidden');
  } else {
    optContainer.classList.add('hidden');
  }
}

// Save or Update Form
function saveFormSchema() {
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

    if (label) {
      fields.push({
        id: Date.now() + Math.random().toString(36).substring(2, 5),
        label,
        type,
        trigger: triggerVal ? triggerVal : 'none',
        options: optionsVal ? optionsVal.split(',').map(o => o.trim()) : []
      });
    }
  });

  if (editingFormIndex !== null) {
    forms[editingFormIndex].title = title;
    forms[editingFormIndex].description = description;
    forms[editingFormIndex].fields = fields;
  } else {
    forms.push({
      id: Date.now(),
      title,
      description,
      createdAt: new Date().toLocaleDateString(),
      fields,
      responses: []
    });
  }

  localStorage.setItem('bethle_forms', JSON.stringify(forms));
  editingFormIndex = null;
  renderHomeView();
}

// Image 1 Request: Form Filler with Label Placeholders Inside Boxes
function openFormFiller(index, isPublicShare = false) {
  const form = forms[index];
  const main = document.getElementById('main-content');

  let fieldsHTML = form.fields.map(field => {
    let inputHTML = '';
    const placeholderText = escapeHtml(field.label);

    if (field.type === 'short') {
      inputHTML = `<input type="text" name="${field.id}" class="form-control" placeholder="${placeholderText}" required>`;
    } else if (field.type === 'paragraph') {
      inputHTML = `<textarea name="${field.id}" class="form-control" rows="3" placeholder="${placeholderText}"></textarea>`;
    } else if (field.type === 'dropdown' || field.type === 'scale') {
      const opts = field.options.length > 0 ? field.options : (field.type === 'scale' ? ['1/10', '2/10', '3/10', '4/10', '5/10', '6/10', '7/10', '8/10', '9/10', '10/10'] : ['Option 1']);
      inputHTML = `
        <select name="${field.id}" class="form-control">
          <option value="" disabled selected>${placeholderText}</option>
          ${opts.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('')}
        </select>
      `;
    } else if (field.type === 'checkbox') {
      inputHTML = `<label><input type="checkbox" name="${field.id}" value="True"> ${placeholderText}</label>`;
    }

    return `<div style="margin-bottom:14px;">${inputHTML}</div>`;
  }).join('');

  main.innerHTML = `
    <div class="card">
      <h2 style="margin-bottom:6px;">${escapeHtml(form.title)}</h2>
      <p style="color:#7f8c8d; font-size:14px; margin-bottom:16px;">${escapeHtml(form.description)}</p>
      <form id="submission-form" onsubmit="handleFormSubmit(event, ${index}, ${isPublicShare})">
        ${fieldsHTML}
        <button type="submit" class="action-btn">Submit</button>
      </form>
    </div>
  `;
}

// Handle Form Submission
function handleFormSubmit(event, index, isPublicShare) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const responseObj = {
    submittedAt: new Date().toLocaleString(),
    answers: {}
  };

  forms[index].fields.forEach(field => {
    responseObj.answers[field.id] = formData.get(field.id) || 'N/A';
  });

  forms[index].responses.push(responseObj);
  localStorage.setItem('bethle_forms', JSON.stringify(forms));

  if (isPublicShare) {
    document.getElementById('main-content').innerHTML = `
      <div class="card" style="text-align:center; padding:30px;">
        <h2 style="color:#2e7d32;">Thank You!</h2>
        <p style="margin-top:10px; color:#4b5563;">Your response has been submitted successfully.</p>
      </div>
    `;
  } else {
    alert('Response submitted successfully!');
    renderHomeView();
  }
}

// Share Functionality
function shareFormLink(formId) {
  const shareUrl = `${window.location.origin}${window.location.pathname}?fill=${formId}`;
  navigator.clipboard.writeText(shareUrl).then(() => {
    alert('Form share link copied to clipboard!\n\n' + shareUrl);
  }).catch(() => {
    prompt('Copy this link to share your form:', shareUrl);
  });
}

// Image 2 Request: Question Regular Weight, Answer BOLD
function viewResponses(index) {
  const form = forms[index];
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

  let responsesHTML = form.responses.map((resp, rIndex) => {
    let answersList = form.fields.map(field => `
      <div class="response-group">
        <div class="question-label-normal">${escapeHtml(field.label)}</div>
        <div class="answer-value-bold">${escapeHtml(resp.answers[field.id] || 'N/A')}</div>
      </div>
    `).join('');

    return `
      <div class="card">
        <div style="font-size:12px; color:#7f8c8d; margin-bottom:12px; border-bottom:1px solid #eee; padding-bottom:6px;">
          Response #${rIndex + 1} &bull; ${resp.submittedAt}
        </div>
        ${answersList}
      </div>
    `;
  }).join('');

  main.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <h2>${escapeHtml(form.title)}</h2>
      <button class="btn-create" style="background:#059669;" onclick="generatePDFReport(${index})">Export PDF</button>
    </div>
    ${responsesHTML}
    <button class="action-btn" style="background:#6b7280; margin-top:10px;" onclick="renderHomeView()">Back to Home</button>
  `;
}

// Flexible Print Trigger Report Generator
function generatePDFReport(index) {
  const form = forms[index];
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Find all fields that have a numeric print trigger
  const triggeredFields = form.fields
    .filter(f => f.trigger !== 'none' && !isNaN(parseInt(f.trigger)))
    .sort((a, b) => parseInt(a.trigger) - parseInt(b.trigger));

  const fieldsToExport = triggeredFields.length > 0 ? triggeredFields : form.fields;

  const tableHeaders = ['S/N', ...fieldsToExport.map(f => f.label)];
  const tableData = form.responses.map((resp, idx) => [
    idx + 1,
    ...fieldsToExport.map(f => resp.answers[f.id] || '')
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
