let absenceReportGeneration=0;
function absenceToday() {
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Colombo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const get=t=>parts.find(p=>p.type===t).value;return get('year')+'-'+get('month')+'-'+get('day');
}
function renderAbsenceFilters(branches) {
  absenceReportGeneration++;
  const today=absenceToday();
  return `<div class="filter-field"><label class="label" for="a-asof">Report date</label><input class="input" type="date" id="a-asof" value="${today}" max="${today}" required></div>
  <div class="filter-field"><label class="label" for="a-days">Not attended for</label><select class="select" id="a-days"><option value="5">5 days or more</option><option value="7" selected>7 days or more</option><option value="30">30 days or more</option></select></div>
  <div class="filter-field"><label class="label" for="a-from">Joining date from</label><input class="input" type="date" id="a-from" max="${today}"></div>
  <div class="filter-field"><label class="label" for="a-to">Joining date to</label><input class="input" type="date" id="a-to" max="${today}"></div>
  <div class="filter-field"><label class="label" for="a-branch">Branch</label><select class="select" id="a-branch"><option value="">All branches</option>${branches.map(b=>'<option value="'+escape(b.BranchID)+'">'+escape(b.BranchName)+'</option>').join('')}</select></div>
  <div class="filter-field"><label class="label" for="a-course">Course</label><select class="select" id="a-course"><option value="">Loading courses…</option></select></div>
  <div style="flex-basis:100%;font-size:.8125rem;color:var(--text-muted)">Calendar days since last recorded attendance. For students who have never attended, counted from their joining date.</div>
  <button class="btn btn-ghost" type="button" onclick="setOlderJoiningDates()">Joined at least 3 months ago</button>`;
}
function setOlderJoiningDates() {
  const asOf=document.getElementById('a-asof').value || absenceToday();
  const [year,month,day]=asOf.split('-').map(Number);
  const first=new Date(Date.UTC(year,month-4,1));
  const end=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0));
  const date=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth(),Math.min(day,end.getUTCDate())));
  document.getElementById('a-from').value='';document.getElementById('a-to').value=date.toISOString().slice(0,10);
}
async function loadAbsenceCourses() {
  const target=document.getElementById('a-course');
  const result=await apiCall('reportAbsenceCourses');
  if(target!==document.getElementById('a-course'))return;
  target.replaceChildren(new Option('All courses',''));
  if(!result?.success){showToast(result?.error || 'Could not load courses. You can still report on all courses.','error');return;}
  result.courses.forEach(name=>target.add(new Option(name,name)));
}
async function generateAbsenceReport() {
  const generation=++absenceReportGeneration;
  const branch=document.getElementById('a-branch').selectedOptions[0].textContent;
  const course=document.getElementById('a-course').selectedOptions[0].textContent;
  const result=await apiCall('reportStudentAbsence',{asOf:document.getElementById('a-asof').value,absentDays:document.getElementById('a-days').value,
    joinedFrom:document.getElementById('a-from').value,joinedTo:document.getElementById('a-to').value,BranchID:document.getElementById('a-branch').value,Course:document.getElementById('a-course').value});
  if(currentReport!=='absence' || generation!==absenceReportGeneration)return result;
  if(!result?.success){showError(result?.error || 'Could not generate absence report');return result;}
  const warnings=[];
  if(result.omittedInvalidJoiningDates)warnings.push(result.omittedInvalidJoiningDates+' students omitted because their joining date is missing or invalid.');
  if(result.omittedInvalidAttendanceDates)warnings.push(result.omittedInvalidAttendanceDates+' students omitted because recorded attendance dates need correction.');
  let table=result.records.length?`<div class="report-table-wrap"><table class="report-table"><thead><tr><th>Reg #</th><th>Student</th><th>Branch</th><th>Course</th><th>Joining date</th><th>Last attended</th><th>Days not attended</th><th>Attendance history</th><th>Phone</th></tr></thead><tbody>${result.records.map(r=>'<tr>'+[r.RegistrationNumber,r.StudentName,r.BranchName,r.Course,r.AdmissionDate,r.LastAttended || 'Never attended',r.DaysAbsent,r.AttendanceHistory,r.PhoneNumber].map(v=>'<td>'+escape(v)+'</td>').join('')+'</tr>').join('')}</tbody></table></div>`:emptyTable('No students match these joining dates, branch, course and absence period.');
  if(warnings.length)table='<p role="status" style="padding:1rem;color:#92400e">'+escape(warnings.join(' '))+'</p>'+table;
  document.getElementById('report-output').innerHTML=reportShell('Students Not Attending',
    result.absentDays+'+ calendar days as of '+result.asOf+' · '+branch+' · '+course+' · Joined '+(result.joinedFrom || 'any date')+' to '+(result.joinedTo || result.asOf),
    [{label:'Matching students',value:result.totalStudents},{label:'Never attended',value:result.neverAttended},{label:'Previously attended',value:result.totalStudents-result.neverAttended}],table);
  return result;
}