// State Management
let forms = JSON.parse(localStorage.getItem('bethle_forms')) || [];
let currentForm = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  renderHomeView();
});

// Render Home View
function renderHomeView() {
  const main = document.getElementById('main-content');
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
        <div style="display:flex; gap:10px; font-size:14px;">
          <a href="#" style="color:#2563eb; text-decoration:none;" onclick="openFormFiller(${index})">Fill</a>
          <a href="#" style="color:#2563eb; text-decoration:none;" onclick="viewResponses(${index})">Responses (${form.responses ? form.responses.length : 0})</a>
        </div>
      </div>
    </div>
  `).join('');

  main.innerHTML = html;
}

// Render Form Builder
function showFormBuilder() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="card">
      <h2 style="margin-bottom:15px;">Create form</h2>
      <input type="text" id="form-title" class="form-control" placeholder="Form title" style="font-size:16px; font-weight:600;" required>
      <input type="text" id="form-desc" class="form-control" placeholder="Description (optional)">
    </div>

    <div id="fields-container"></div>

    <button class="action-btn" style="background:#e5e7eb; color:#374151; margin-bottom:12px;" onclick="addFieldSector()">+ Add sector / field</button>
    <button class="action-btn" onclick="saveFormSchema()">Save form</button>
  `;

  addFieldSector();
}

// Add Dynamic Sector Field with Print Trigger Configuration
function addFieldSector() {
  const container = document.getElementById('fields-container');
  const fieldId = Date.now() + Math.random().toString(36).substring(2, 5);

  const sectorDiv = document.createElement('div');
  sectorDiv.className = 'sector-item';
  sectorDiv.id = `sector-${fieldId}`;
  sectorDiv.innerHTML = `
    <div style="display:flex; gap:10px;">
      <input type="text" class="form-control field-label" placeholder="Field label (e.g. Full Name)" style="flex:2;">
      <select class="form-control field-type" style="flex:1;" onchange="handleTypeChange('${fieldId}', this.value)">
        <option value="short">Short text</option>
        <option value="paragraph">Paragraph</option>
        <option value="dropdown">Dropdown</option>
        <option value="scale">Linear Scale / Ratio (7/10)</option>
        <option value="checkbox">Single Checkbox</option>
      </select>
    </div>

    <div id="options-container-${fieldId}" class="hidden" style="margin-bottom:10px;">
      <input type="text" class="form-control field-options" placeholder="Options separated by comma (e.g. Director, Actor, Makeup)">
    </div>

    <div class="trigger-container">
      <label style="font-weight:600;">Read me (Print Column Trigger):</label>
      <select class="trigger-select field-trigger">
        <option value="none">Do Not Print</option>
        <option value="1">Column 1 (e.g., Name)</option>
        <option value="2">Column 2 (e.g., Profession)</option>
        <option value="3">Column 3 (e.g., Extra Info)</option>
      </select>
      <button style="margin-left:auto; color:#dc2626; background:none; border:none; cursor:pointer;" onclick="document.getElementById('sector-${fieldId}').remove()">Remove</button>
    </div>
  `;

  container.appendChild(sectorDiv);
}

function handleTypeChange(fieldId, type) {
  const optContainer = document.getElementById(`options-container-${fieldId}`);
  if (type === 'dropdown' || type === 'scale') {
    optContainer.classList.remove('hidden');
    const input = optContainer.querySelector('input');
    if (type === 'scale') {
      input.placeholder = "Enter scale range or options (e.g. 1/10, 2/10, ... 10/10 or 2%, 5%, 10%)";
    } else {
      input.placeholder = "Options separated by comma (e.g. Director, Actor, Makeup)";
    }
  } else {
    optContainer.classList.add('hidden');
  }
}

// Save Form
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
    const trigger = el.querySelector('.field-trigger').value;
    const optionsVal = el.querySelector('.field-options') ? el.querySelector('.field-options').value : '';

    if (label) {
      fields.push({
        id: Date.now() + Math.random().toString(36).substring(2, 5),
        label,
        type,
        trigger,
        options: optionsVal ? optionsVal.split(',').map(o => o.trim()) : []
      });
    }
  });

  const newForm = {
    id: Date.now(),
    title,
    description,
    createdAt: new Date().toLocaleDateString(),
    fields,
    responses: []
  };

  forms.push(newForm);
  localStorage.setItem('bethle_forms', JSON.stringify(forms));
  renderHomeView();
}

// Form Filler
function openFormFiller(index) {
  currentForm = forms[index];
  const main = document.getElementById('main-content');

  let fieldsHTML = currentForm.fields.map(field => {
    let inputHTML = '';
    if (field.type === 'short') {
      inputHTML = `<input type="text" name="${field.id}" class="form-control" required>`;
    } else if (field.type === 'paragraph') {
      inputHTML = `<textarea name="${field.id}" class="form-control" rows="3"></textarea>`;
    } else if (field.type === 'dropdown' || field.type === 'scale') {
      const opts = field.options.length > 0 ? field.options : (field.type === 'scale' ? ['1/10', '2/10', '3/10', '4/10', '5/10', '6/10', '7/10', '8/10', '9/10', '10/10'] : ['Option 1']);
      inputHTML = `<select name="${field.id}" class="form-control">${opts.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('')}</select>`;
    } else if (field.type === 'checkbox') {
      inputHTML = `<label><input type="checkbox" name="${field.id}" value="True"> Yes / Confirm</label>`;
    }

    return `
      <div style="margin-bottom:16px;">
        <label class="question-label" style="display:block; margin-bottom:6px;">${escapeHtml(field.label)}</label>
        ${inputHTML}
      </div>
    `;
  }).join('');

  main.innerHTML = `
    <div class="card">
      <h2 style="margin-bottom:6px;">${escapeHtml(currentForm.title)}</h2>
      <p style="color:#7f8c8d; font-size:14px; margin-bottom:16px;">${escapeHtml(currentForm.description)}</p>
      <form id="submission-form" onsubmit="handleFormSubmit(event, ${index})">
        ${fieldsHTML}
        <button type="submit" class="action-btn">Submit</button>
      </form>
    </div>
  `;
}

// Handle Submission
function handleFormSubmit(event, index) {
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
  alert('Response submitted successfully!');
  renderHomeView();
}

// Display Responses
function viewResponses(index) {
  const form = forms[index];
  const main = document.getElementById('main-content');

  if (!form.responses || form.responses.length === 0) {
    main.innerHTML = `
      <div class="card">
        <h2>${escapeHtml(form.title)}</h2>
        <p style="margin-top:10px; color:#7f8c8d;">No responses recorded yet.</p>
        <button class="action-btn" style="background:#6b7280; margin-top:15px;" onclick="renderHomeView()">Back</button>
      </div>
    `;
    return;
  }

  let responsesHTML = form.responses.map((resp, rIndex) => {
    let answersList = form.fields.map(field => `
      <div class="response-group">
        <div class="question-label">${escapeHtml(field.label)}</div>
        <div class="answer-value">${escapeHtml(resp.answers[field.id] || 'N/A')}</div>
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

// Export PDF Table
function generatePDFReport(index) {
  const form = forms[index];
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const col1Field = form.fields.find(f => f.trigger === '1') || form.fields[0];
  const col2Field = form.fields.find(f => f.trigger === '2') || form.fields[1];
  const col3Field = form.fields.find(f => f.trigger === '3') || form.fields[2];

  const col1Header = col1Field ? col1Field.label : 'Name';
  const col2Header = col2Field ? col2Field.label : 'Profession / Sector';
  const col3Header = col3Field ? col3Field.label : 'Trigger Option';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(form.title, 105, 20, { align: 'center' });

  const tableData = form.responses.map((resp, idx) => [
    idx + 1,
    col1Field ? resp.answers[col1Field.id] || '' : '',
    col2Field ? resp.answers[col2Field.id] || '' : '',
    col3Field ? resp.answers[col3Field.id] || '' : ''
  ]);

  doc.autoTable({
    startY: 30,
    head: [['S/N', col1Header, col2Header, col3Header]],
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
