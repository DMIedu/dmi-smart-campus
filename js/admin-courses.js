const courseAdmin = requireAuth(['admin']);
if (!courseAdmin) throw new Error('redirect');
const courseForm = document.getElementById('course-form');
const courseStatus = document.getElementById('course-status');
let courseSaving = false;
async function loadAdminCourses() {
  const result = await apiCall('listRegistrationCourses');
  if (!result?.success) { courseStatus.textContent=result?.error || 'Could not load courses. Refresh to try again.'; return; }
  const list = document.getElementById('course-list');list.replaceChildren();
  for (const department of ['IT','English','Kids','IELTS','BCSS']) {
    const section=document.createElement('section');section.className='card course-group';
    const title=document.createElement('h2');title.textContent=department;section.appendChild(title);
    const names=result.courses.filter(c=>c.department===department).map(c=>c.name);
    if (!names.length) {const empty=document.createElement('p');empty.className='hint';empty.textContent='No courses yet.';section.appendChild(empty);}
    else {const ul=document.createElement('ul');for(const name of names){const li=document.createElement('li');li.textContent=name;ul.appendChild(li);}section.appendChild(ul);}
    list.appendChild(section);
  }
}
courseForm.addEventListener('submit',async event=>{
  event.preventDefault();if(courseSaving)return;
  const Department=document.getElementById('course-department').value;
  const CourseName=document.getElementById('course-name').value.trim();
  if(!Department || CourseName.length<2)return;
  courseSaving=true;const button=document.getElementById('save-course');button.disabled=true;button.textContent='Saving…';courseStatus.textContent='';
  try {const result=await apiCall('createRegistrationCourse',{Department,CourseName});
    if(!result?.success){courseStatus.textContent=result?.error || 'Could not save course. Try again.';return;}
    document.getElementById('course-name').value='';
    courseStatus.textContent=result.alreadyExists?'This course already exists in this department.':result.course.name+' saved. Reception can select it for registration.';
    await loadAdminCourses();
  } finally {courseSaving=false;button.disabled=false;button.textContent='Save course';}
});
loadAdminCourses();