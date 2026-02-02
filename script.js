const API_URL = 'api.php';

// Check authentication on page load
function checkAuthentication() {
    const session = localStorage.getItem('gymProSession') || sessionStorage.getItem('gymProSession');
    
    if (!session) {
        // No session found, redirect to login
        window.location.href = 'index.html';
        return false;
    }
    
    try {
        const sessionData = JSON.parse(session);
        // Display user information
        document.getElementById('userName').textContent = `${sessionData.firstName} ${sessionData.lastName}`;
        document.getElementById('userEmail').textContent = sessionData.email;
        return true;
    } catch (error) {
        console.error('Invalid session data:', error);
        window.location.href = 'index.html';
        return false;
    }
}

// Logout function
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear session data
        localStorage.removeItem('gymProSession');
        sessionStorage.removeItem('gymProSession');
        
        // Redirect to login page
        window.location.href = 'index.html';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!checkAuthentication()) {
        return; // Don't load anything else if not authenticated
    }
    
    // Load all the data
    loadDashboardStats();
    loadMembers();
    loadSubscriptions();
    loadPlans();
    loadTrainers();
    loadClasses();
    loadMemberOptions();
    loadPlanOptions();
    loadTrainerOptions();
    document.getElementById('sub_start_date').value = new Date().toISOString().split('T')[0];
});

function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(sectionName).style.display = 'block';
    event.target.classList.add('active');
}

function loadDashboardStats() {
    fetch(`${API_URL}?action=get_dashboard_stats`)
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                document.getElementById('totalMembers').textContent = data.total_members;
                document.getElementById('activeSubscriptions').textContent = data.active_subscriptions;
                document.getElementById('monthlyRevenue').textContent = `₱${parseFloat(data.monthly_revenue).toLocaleString('en-PH', {minimumFractionDigits: 2})}`;
                document.getElementById('totalClasses').textContent = data.total_classes;
            }
        });
}

function loadMembers() {
    fetch(`${API_URL}?action=read_members`)
        .then(res => res.json())
        .then(data => {
            if(data.success) displayMembersTable(data.data);
        });
}

function displayMembersTable(members) {
    const tbody = document.getElementById('membersTable');
    if(members.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No members found</td></tr>';
        return;
    }
    tbody.innerHTML = members.map(m => `
        <tr>
            <td>${m.member_id}</td>
            <td>${m.first_name} ${m.last_name}</td>
            <td>${m.email}</td>
            <td>${m.phone}</td>
            <td>${formatDate(m.join_date)}</td>
            <td><span class="badge badge-${m.status.toLowerCase()}">${m.status}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-warning btn-sm" onclick='editMember(${JSON.stringify(m)})'>Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteMember(${m.member_id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openMemberModal() {
    document.getElementById('memberModalTitle').textContent = 'New Member';
    document.getElementById('memberForm').reset();
    document.getElementById('member_id').value = '';
    document.getElementById('statusGroup').style.display = 'none';
    document.getElementById('memberModal').classList.add('active');
}

function closeMemberModal() {
    document.getElementById('memberModal').classList.remove('active');
}

function editMember(member) {
    document.getElementById('memberModalTitle').textContent = 'Edit Member';
    document.getElementById('member_id').value = member.member_id;
    document.getElementById('member_first_name').value = member.first_name;
    document.getElementById('member_last_name').value = member.last_name;
    document.getElementById('member_email').value = member.email;
    document.getElementById('member_phone').value = member.phone;
    document.getElementById('member_dob').value = member.date_of_birth;
    document.getElementById('member_gender').value = member.gender;
    document.getElementById('member_address').value = member.address || '';
    document.getElementById('member_emergency_contact').value = member.emergency_contact || '';
    document.getElementById('member_emergency_phone').value = member.emergency_phone || '';
    document.getElementById('member_status').value = member.status;
    document.getElementById('statusGroup').style.display = 'block';
    document.getElementById('memberModal').classList.add('active');
}

function saveMember(e) {
    e.preventDefault();
    const memberId = document.getElementById('member_id').value;
    const action = memberId ? 'update_member' : 'create_member';
    const formData = new FormData();
    formData.append('action', action);
    if(memberId) {
        formData.append('member_id', memberId);
        formData.append('status', document.getElementById('member_status').value);
    }
    formData.append('first_name', document.getElementById('member_first_name').value);
    formData.append('last_name', document.getElementById('member_last_name').value);
    formData.append('email', document.getElementById('member_email').value);
    formData.append('phone', document.getElementById('member_phone').value);
    formData.append('date_of_birth', document.getElementById('member_dob').value);
    formData.append('gender', document.getElementById('member_gender').value);
    formData.append('address', document.getElementById('member_address').value);
    formData.append('emergency_contact', document.getElementById('member_emergency_contact').value);
    formData.append('emergency_phone', document.getElementById('member_emergency_phone').value);
    
    fetch(API_URL, {method: 'POST', body: formData})
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                alert(data.message);
                closeMemberModal();
                loadMembers();
                loadMemberOptions();
                loadDashboardStats();
            } else {
                alert('Error: ' + data.message);
            }
        });
}

function deleteMember(id) {
    if(!confirm('Delete this member?')) return;
    const formData = new FormData();
    formData.append('action', 'delete_member');
    formData.append('member_id', id);
    fetch(API_URL, {method: 'POST', body: formData})
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                alert(data.message);
                loadMembers();
                loadDashboardStats();
            } else {
                alert('Error: ' + data.message);
            }
        });
}

function loadSubscriptions() {
    fetch(`${API_URL}?action=read_subscriptions`)
        .then(res => res.json())
        .then(data => {
            if(data.success) displaySubscriptionsTable(data.data);
        });
}

function displaySubscriptionsTable(subs) {
    const tbody = document.getElementById('subscriptionsTable');
    if(subs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No subscriptions found</td></tr>';
        return;
    }
    tbody.innerHTML = subs.map(s => `
        <tr>
            <td>${s.subscription_id}</td>
            <td>${s.first_name} ${s.last_name}</td>
            <td>${s.plan_name}</td>
            <td>${formatDate(s.start_date)}</td>
            <td>${formatDate(s.end_date)}</td>
            <td>₱${parseFloat(s.amount_paid).toFixed(2)}</td>
            <td><span class="badge badge-${s.status.toLowerCase()}">${s.status}</span></td>
            <td><button class="btn btn-warning btn-sm">View</button></td>
        </tr>
    `).join('');
}

function openSubscriptionModal() {
    document.getElementById('sub_start_date').value = new Date().toISOString().split('T')[0];
    document.getElementById('subscriptionModal').classList.add('active');
}

function closeSubscriptionModal() {
    document.getElementById('subscriptionModal').classList.remove('active');
}

function saveSubscription(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('action', 'create_subscription');
    formData.append('member_id', document.getElementById('sub_member_id').value);
    formData.append('plan_id', document.getElementById('sub_plan_id').value);
    formData.append('start_date', document.getElementById('sub_start_date').value);
    formData.append('payment_method', document.getElementById('sub_payment_method').value);
    formData.append('notes', document.getElementById('sub_notes').value);
    
    fetch(API_URL, {method: 'POST', body: formData})
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                alert(data.message);
                closeSubscriptionModal();
                loadSubscriptions();
                loadDashboardStats();
            } else {
                alert('Error: ' + data.message);
            }
        });
}

function loadPlans() {
    fetch(`${API_URL}?action=read_plans`)
        .then(res => res.json())
        .then(data => {
            if(data.success) displayPlansGrid(data.data);
        });
}

function displayPlansGrid(plans) {
    const grid = document.getElementById('plansGrid');
    if(plans.length === 0) {
        grid.innerHTML = '<div class="stat-card">No plans available</div>';
        return;
    }
    grid.innerHTML = plans.map(p => `
        <div class="stat-card">
            <h3 style="font-size:22px;margin-bottom:12px;font-weight:800;">${p.plan_name}</h3>
            <p style="color:var(--gray);font-size:14px;margin-bottom:12px;">${p.description || 'No description'}</p>
            <p style="font-size:14px;margin-bottom:8px;"><strong>Duration:</strong> ${p.duration_days} days</p>
            <p style="font-size:14px;margin-bottom:16px;"><strong>Features:</strong> ${p.features || 'N/A'}</p>
            <p style="font-size:28px;color:var(--primary);font-weight:800;margin-top:16px;">₱${parseFloat(p.price).toFixed(2)}</p>
            <div style="margin-top:20px;display:flex;gap:8px;">
                <button class="btn btn-warning btn-sm" onclick='editPlan(${JSON.stringify(p)})'>Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deletePlan(${p.plan_id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function openPlanModal() {
    document.getElementById('planModalTitle').textContent = 'New Plan';
    document.getElementById('plan_id').value = '';
    document.getElementById('planModal').classList.add('active');
}

function closePlanModal() {
    document.getElementById('planModal').classList.remove('active');
}

function editPlan(plan) {
    document.getElementById('planModalTitle').textContent = 'Edit Plan';
    document.getElementById('plan_id').value = plan.plan_id;
    document.getElementById('plan_name').value = plan.plan_name;
    document.getElementById('plan_duration').value = plan.duration_days;
    document.getElementById('plan_price').value = plan.price;
    document.getElementById('plan_description').value = plan.description || '';
    document.getElementById('plan_features').value = plan.features || '';
    document.getElementById('planModal').classList.add('active');
}

function savePlan(e) {
    e.preventDefault();
    const planId = document.getElementById('plan_id').value;
    const action = planId ? 'update_plan' : 'create_plan';
    const formData = new FormData();
    formData.append('action', action);
    if(planId) formData.append('plan_id', planId);
    formData.append('plan_name', document.getElementById('plan_name').value);
    formData.append('duration_days', document.getElementById('plan_duration').value);
    formData.append('price', document.getElementById('plan_price').value);
    formData.append('description', document.getElementById('plan_description').value);
    formData.append('features', document.getElementById('plan_features').value);
    
    fetch(API_URL, {method: 'POST', body: formData})
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                alert(data.message);
                closePlanModal();
                loadPlans();
                loadPlanOptions();
            } else {
                alert('Error: ' + data.message);
            }
        });
}

function deletePlan(id) {
    if(!confirm('Delete this plan?')) return;
    const formData = new FormData();
    formData.append('action', 'delete_plan');
    formData.append('plan_id', id);
    fetch(API_URL, {method: 'POST', body: formData})
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                alert(data.message);
                loadPlans();
            } else {
                alert('Error: ' + data.message);
            }
        });
}

function loadTrainers() {
    fetch(`${API_URL}?action=read_trainers`)
        .then(res => res.json())
        .then(data => {
            if(data.success) displayTrainersTable(data.data);
        });
}

function displayTrainersTable(trainers) {
    const tbody = document.getElementById('trainersTable');
    if(trainers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No trainers found</td></tr>';
        return;
    }
    tbody.innerHTML = trainers.map(t => `
        <tr>
            <td>${t.trainer_id}</td>
            <td>${t.first_name} ${t.last_name}</td>
            <td>${t.email}</td>
            <td>${t.phone}</td>
            <td>${t.specialization || 'N/A'}</td>
            <td>₱${parseFloat(t.hourly_rate).toFixed(2)}</td>
            <td><span class="badge badge-${t.status.toLowerCase()}">${t.status}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-warning btn-sm" onclick='editTrainer(${JSON.stringify(t)})'>Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteTrainer(${t.trainer_id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openTrainerModal() {
    document.getElementById('trainerModalTitle').textContent = 'New Trainer';
    document.getElementById('trainer_id').value = '';
    document.getElementById('trainerStatusGroup').style.display = 'none';
    document.getElementById('trainerModal').classList.add('active');
}

function closeTrainerModal() {
    document.getElementById('trainerModal').classList.remove('active');
}

function editTrainer(trainer) {
    document.getElementById('trainerModalTitle').textContent = 'Edit Trainer';
    document.getElementById('trainer_id').value = trainer.trainer_id;
    document.getElementById('trainer_first_name').value = trainer.first_name;
    document.getElementById('trainer_last_name').value = trainer.last_name;
    document.getElementById('trainer_email').value = trainer.email;
    document.getElementById('trainer_phone').value = trainer.phone;
    document.getElementById('trainer_specialization').value = trainer.specialization || '';
    document.getElementById('trainer_rate').value = trainer.hourly_rate;
    document.getElementById('trainer_status').value = trainer.status;
    document.getElementById('trainerStatusGroup').style.display = 'block';
    document.getElementById('trainerModal').classList.add('active');
}

function saveTrainer(e) {
    e.preventDefault();
    const trainerId = document.getElementById('trainer_id').value;
    const action = trainerId ? 'update_trainer' : 'create_trainer';
    const formData = new FormData();
    formData.append('action', action);
    if(trainerId) {
        formData.append('trainer_id', trainerId);
        formData.append('status', document.getElementById('trainer_status').value);
    }
    formData.append('first_name', document.getElementById('trainer_first_name').value);
    formData.append('last_name', document.getElementById('trainer_last_name').value);
    formData.append('email', document.getElementById('trainer_email').value);
    formData.append('phone', document.getElementById('trainer_phone').value);
    formData.append('specialization', document.getElementById('trainer_specialization').value);
    formData.append('hourly_rate', document.getElementById('trainer_rate').value);
    
    fetch(API_URL, {method: 'POST', body: formData})
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                alert(data.message);
                closeTrainerModal();
                loadTrainers();
                loadTrainerOptions();
            } else {
                alert('Error: ' + data.message);
            }
        });
}

function deleteTrainer(id) {
    if(!confirm('Delete this trainer?')) return;
    const formData = new FormData();
    formData.append('action', 'delete_trainer');
    formData.append('trainer_id', id);
    fetch(API_URL, {method: 'POST', body: formData})
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                alert(data.message);
                loadTrainers();
            } else {
                alert('Error: ' + data.message);
            }
        });
}

function loadClasses() {
    fetch(`${API_URL}?action=read_classes`)
        .then(res => res.json())
        .then(data => {
            if(data.success) displayClassesTable(data.data);
        });
}

function displayClassesTable(classes) {
    const tbody = document.getElementById('classesTable');
    if(classes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No classes found</td></tr>';
        return;
    }
    tbody.innerHTML = classes.map(c => `
        <tr>
            <td>${c.class_id}</td>
            <td>${c.class_name}</td>
            <td>${c.class_type}</td>
            <td>${c.trainer_name || 'N/A'}</td>
            <td>${c.duration_minutes} min</td>
            <td>${c.max_capacity}</td>
            <td>₱${parseFloat(c.price_per_session).toFixed(2)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-warning btn-sm" onclick='editClass(${JSON.stringify(c)})'>Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteClass(${c.class_id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openClassModal() {
    document.getElementById('classModalTitle').textContent = 'New Class';
    document.getElementById('class_id').value = '';
    document.getElementById('classModal').classList.add('active');
}

function closeClassModal() {
    document.getElementById('classModal').classList.remove('active');
}

function editClass(cls) {
    document.getElementById('classModalTitle').textContent = 'Edit Class';
    document.getElementById('class_id').value = cls.class_id;
    document.getElementById('class_name').value = cls.class_name;
    document.getElementById('class_type').value = cls.class_type;
    document.getElementById('class_trainer_id').value = cls.trainer_id;
    document.getElementById('class_duration').value = cls.duration_minutes;
    document.getElementById('class_capacity').value = cls.max_capacity;
    document.getElementById('class_price').value = cls.price_per_session;
    document.getElementById('class_description').value = cls.description || '';
    document.getElementById('classModal').classList.add('active');
}

function saveClass(e) {
    e.preventDefault();
    const classId = document.getElementById('class_id').value;
    const action = classId ? 'update_class' : 'create_class';
    const formData = new FormData();
    formData.append('action', action);
    if(classId) formData.append('class_id', classId);
    formData.append('class_name', document.getElementById('class_name').value);
    formData.append('class_type', document.getElementById('class_type').value);
    formData.append('trainer_id', document.getElementById('class_trainer_id').value);
    formData.append('duration_minutes', document.getElementById('class_duration').value);
    formData.append('max_capacity', document.getElementById('class_capacity').value);
    formData.append('price_per_session', document.getElementById('class_price').value);
    formData.append('description', document.getElementById('class_description').value);
    
    fetch(API_URL, {method: 'POST', body: formData})
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                alert(data.message);
                closeClassModal();
                loadClasses();
                loadDashboardStats();
            } else {
                alert('Error: ' + data.message);
            }
        });
}

function deleteClass(id) {
    if(!confirm('Delete this class?')) return;
    const formData = new FormData();
    formData.append('action', 'delete_class');
    formData.append('class_id', id);
    fetch(API_URL, {method: 'POST', body: formData})
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                alert(data.message);
                loadClasses();
            } else {
                alert('Error: ' + data.message);
            }
        });
}

function loadMemberOptions() {
    fetch(`${API_URL}?action=read_members`)
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                const select = document.getElementById('sub_member_id');
                select.innerHTML = '<option value="">Select Member</option>' +
                    data.data.map(m => `<option value="${m.member_id}">${m.first_name} ${m.last_name}</option>`).join('');
            }
        });
}

function loadPlanOptions() {
    fetch(`${API_URL}?action=read_plans`)
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                const select = document.getElementById('sub_plan_id');
                select.innerHTML = '<option value="">Select Plan</option>' +
                    data.data.map(p => `<option value="${p.plan_id}">${p.plan_name} - ₱${parseFloat(p.price).toFixed(2)}</option>`).join('');
            }
        });
}

function loadTrainerOptions() {
    fetch(`${API_URL}?action=read_trainers`)
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                const select = document.getElementById('class_trainer_id');
                select.innerHTML = '<option value="">Select Trainer</option>' +
                    data.data.map(t => `<option value="${t.trainer_id}">${t.first_name} ${t.last_name}</option>`).join('');
            }
        });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
