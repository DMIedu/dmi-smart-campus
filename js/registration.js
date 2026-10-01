const user = requireAuth(['admin', 'reception']);
if (!user) throw new Error('redirect');

const studentForm = document.getElementById('student-form');
const branchSelect = document.getElementById('branch-select');
const departmentSelect = document.getElementById('department-select');
const serialInput = document.getElementById('registration-serial');
let allCourses = [];
const courseSelect = document.getElementById('course-select');
const registrationInput = document.getElementById('registration-number');
const registrationHint = document.getElementById('registration-hint');
const manualRegistration = document.getElementById('manual-registration');
const submitButton = document.getElementById('submit-btn');
const coursePanel = document.getElementById('new-course-panel');
const courseToggle = document.getElementById('add-course-toggle');
const courseSaveButton = document.getElementById('save-course-btn');
const courseStatus = document.getElementById('course-save-status');
const canCreateCourse = user.role === 'admin';
courseToggle.hidden = !canCreateCourse;
let previewGeneration = 0;
let previewReady = false;
let registering = false;
let savingCourse = false;

function campusToday() {
  const parts = new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Colombo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const value = type => parts.find(p => p.type === type).value;
  return value('year') + '-' + value('month') + '-' + value('day');
}
function updateSubmitState() {
  submitButton.disabled = registering || savingCourse || (!manualRegistration.checked && !previewReady);
}
function renderCourses(selected = '') {
  courseSelect.replaceChildren(new Option(departmentSelect.value ? 'Select course...' : 'Select department first...', ''));
  allCourses.filter(c => c.department === departmentSelect.value).forEach(c => courseSelect.add(new Option(c.name,c.name)));
  courseSelect.value = selected;
}
function addCourseOption(course) {
  if (!allCourses.some(c => c.department === course.department && c.name.toLowerCase() === course.name.toLowerCase())) allCourses.push(course);
  departmentSelect.value = course.department;
  renderCourses(course.name);
}
async function loadRegistrationCourses() {
  const result = await apiCall('listRegistrationCourses');
  if (!result?.success) {
    showToast(result?.error || 'Could not load saved courses. Please try again.', 'error');
    return;
  }
  allCourses = result.courses;
  renderCourses();
  refreshRegistrationNumber();
}
async function loadBranches() {
  const result = await apiCall('listBranches');
  branchSelect.replaceChildren(new Option(result?.success ? 'Select branch...' : 'Could not load branches', ''));
  if (!result?.success) { registrationHint.textContent = 'Could not load branches. Refresh the page to try again.'; return; }
  result.branches.filter(b => b.Status !== 'Inactive').forEach(b => {
    const selected = String(b.BranchID) === String(user.branchId);
    branchSelect.add(new Option(b.BranchName, b.BranchID, selected, selected));
  });
  if (user.role === 'reception') branchSelect.disabled = true;
  refreshRegistrationNumber();
}
async function refreshRegistrationNumber() {
  const generation = ++previewGeneration;
  previewReady = false;
  serialInput.value = '';
  if (manualRegistration.checked) {
    registrationHint.textContent = 'Enter a unique registration number. The server checks it when saving.';
    updateSubmitState(); return;
  }
  registrationInput.value = '';
  const branchId = branchSelect.value, department = departmentSelect.value, course = courseSelect.value;
  if (!branchId || !department || !course) {
    registrationHint.textContent = 'Select a branch, department and course to show the next number.';
    updateSubmitState(); return;
  }
  registrationHint.textContent = 'Getting the next registration number…';
  updateSubmitState();
  const result = await apiCall('previewRegistrationNumber', {BranchID:branchId, Department:department, Course:course});
  if (generation !== previewGeneration || manualRegistration.checked || branchSelect.value !== branchId || departmentSelect.value !== department || courseSelect.value !== course) return;
  if (result?.success) {
    registrationInput.value = result.registrationNumber;
    serialInput.value = result.serialNumber;
    registrationHint.textContent = 'Next number for this branch and department. The final number is confirmed when you register.';
    previewReady = true;
  } else registrationHint.textContent = result?.error || 'Could not get a registration number. Select the course again to retry.';
  updateSubmitState();
}
branchSelect.addEventListener('change', refreshRegistrationNumber);
departmentSelect.addEventListener('change', () => { renderCourses(); refreshRegistrationNumber(); });
courseSelect.addEventListener('change', refreshRegistrationNumber);
registrationInput.addEventListener('focus', () => {
  if (manualRegistration.checked) return;
  if (!branchSelect.value) branchSelect.focus();
  else if (!departmentSelect.value) departmentSelect.focus();
  else if (!courseSelect.value) courseSelect.focus();
});
manualRegistration.addEventListener('change', () => {
  registrationInput.readOnly = !manualRegistration.checked;
  registrationInput.required = manualRegistration.checked;
  registrationInput.value = '';
  if (manualRegistration.checked) registrationInput.focus();
  refreshRegistrationNumber();
});
function setCoursePanel(open) {
  if (open && !canCreateCourse) return;
  coursePanel.hidden = !open;
  courseToggle.setAttribute('aria-expanded', String(open));
  courseStatus.textContent = '';
  if (open) { document.getElementById('new-course-category').value = departmentSelect.value || 'English'; document.getElementById('new-course-name').focus(); }
  else courseToggle.focus();
}
courseToggle.addEventListener('click', () => setCoursePanel(coursePanel.hidden));
document.getElementById('cancel-course-btn').addEventListener('click', () => setCoursePanel(false));
courseSaveButton.addEventListener('click', async () => {
  if (!canCreateCourse || savingCourse) return;
  const input = document.getElementById('new-course-name');
  const name = input.value.trim();
  if (name.length < 2) { courseStatus.textContent = 'Enter a course name of at least 2 characters.'; input.focus(); return; }
  savingCourse = true; courseSaveButton.disabled = true; courseSaveButton.textContent = 'Saving…';
  courseToggle.disabled = true; document.getElementById('cancel-course-btn').disabled = true;
  courseStatus.textContent = ''; updateSubmitState();
  try {
    const result = await apiCall('createRegistrationCourse', {CourseName:name, Department:document.getElementById('new-course-category').value});
    if (!result?.success) { courseStatus.textContent = result?.error || 'Could not save the course. Try again.'; return; }
    addCourseOption(result.course);
    input.value = ''; setCoursePanel(false);
    showToast(result.alreadyExists ? 'Course already exists. Selected it for you.' : 'Course saved and selected.', 'success');
    await refreshRegistrationNumber();
  } finally {
    savingCourse = false; courseSaveButton.disabled = false; courseSaveButton.textContent = 'Save course';
    courseToggle.disabled = false; document.getElementById('cancel-course-btn').disabled = false; updateSubmitState();
  }
});
studentForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (registering || savingCourse || (!manualRegistration.checked && !previewReady)) return;
  registering = true; updateSubmitState(); submitButton.textContent = 'Registering…';
  const params = Object.fromEntries(Array.from(new FormData(studentForm)).filter(([,v]) => v));
  params.BranchID = branchSelect.value;
  params.RegistrationMode = manualRegistration.checked ? 'Manual' : 'Auto';
  try {
    const result = await apiCall('createStudent', params);
    if (result?.success) {
      document.getElementById('success-name').textContent = result.student.StudentName;
      document.getElementById('cred-reg').textContent = result.student.RegistrationNumber;
      document.getElementById('cred-user').textContent = result.loginCredentials.username;
      document.getElementById('cred-pass').textContent = result.loginCredentials.defaultPassword;
      document.getElementById('cred-qr').textContent = result.student.QRCodeID;
      document.getElementById('success-overlay').classList.add('active');
      if (result.registrationNumberChanged) showToast('Another registration used the preview number. Your final number is shown here.', 'info');
    } else { showToast(result?.error || 'Failed to register student', 'error'); if (!manualRegistration.checked) await refreshRegistrationNumber(); }
  } finally { registering = false; submitButton.textContent = 'Register Student'; updateSubmitState(); }
});
function addAnother() {
  document.getElementById('success-overlay').classList.remove('active');
  studentForm.reset();
  renderCourses();
  document.getElementById('admission-date').value = campusToday();
  if (user.branchId) branchSelect.value = user.branchId;
  registrationInput.readOnly = true; registrationInput.required = false;
  setCoursePanel(false); refreshRegistrationNumber();
  studentForm.querySelector('input[name="StudentName"]').focus();
  window.scrollTo({top:0,behavior:'smooth'});
}
document.getElementById('admission-date').value = campusToday();
updateSubmitState();
loadBranches();
loadRegistrationCourses();
