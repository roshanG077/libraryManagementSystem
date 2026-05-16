// Global Initialization
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    
    // Auth Pages (Login/Register)
    if (path.includes('login.html') || path.includes('register.html')) {
        handleAuthAlerts();
    }
    
    // Admin Dashboard
    if (path.includes('index.html')) {
        initAdminDashboard();
    }
    
    // Issue Book Page
    if (path.includes('issuebook.html')) {
        initIssueBookForm();
    }

    // Books Page
    if (path.includes('books.html')) {
        renderNavbar('books');
        initBooksPage();
    }

    // Members Page
    if (path.includes('members.html')) {
        renderNavbar('members');
        initMembersPage();
    }

    // Issued Books Page
    if (path.includes('issued_books.html')) {
        renderNavbar('issued');
        initIssuedBooksPage();
    }

    // Dynamic Navbar Renderer for specific pages
    if (path.includes('books.html')) renderNavbar('books');
    else if (path.includes('members.html')) renderNavbar('members');
    else if (path.includes('issued_books.html')) renderNavbar('issued');

    // Generic URL Message Handler (Toasts)
    const urlParams = new URLSearchParams(window.location.search);
    const msg = urlParams.get('msg');
    const toastError = urlParams.get('error');

    if (msg === 'issued') showToast('Book issued successfully');
    if (msg === 'returned') showToast('Book returned successfully');
    if (msg === 'saved') showToast('Settings saved');
    if (msg === 'deleted') showToast('Deleted successfully');

    if (toastError === 'invalid') showToast('Invalid input provided', true);
    if (toastError === 'failed') showToast('Operation failed', true);
});

// ── AUTH ALERTS ───────────────────────────────────────────────────────────
function handleAuthAlerts() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;

    if (error) {
        let msg = "An error occurred.";
        if (error === 'invalid_credentials') msg = "Invalid email or password. Please try again.";
        else if (error === 'empty_fields') msg = "Please fill in all required fields.";
        else if (error === 'invalid_phone') msg = "Please enter a valid phone number.";
        else if (error === 'failed') msg = "Registration failed. Please try again.";
        
        alertContainer.innerHTML = `
            <div class="lib-alert lib-alert-error">
                <i class="fas fa-exclamation-circle"></i>
                <span>${msg}</span>
            </div>
        `;
    } else if (success === 'registered') {
        alertContainer.innerHTML = `
            <div class="lib-alert lib-alert-success">
                <i class="fas fa-check-circle"></i>
                <span>Registration successful! Please sign in.</span>
            </div>
        `;
    }
}

// ── ADMIN DASHBOARD ───────────────────────────────────────────────────────
function initAdminDashboard() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    fetch('DashboardDataServlet')
        .then(res => {
            if (!res.ok) throw new Error('Server error: ' + res.status);
            return res.json();
        })
        .then(data => {
            // Stats
            if (document.getElementById('totalBooks'))   document.getElementById('totalBooks').textContent   = data.totalBooks   ?? 0;
            if (document.getElementById('totalMembers')) document.getElementById('totalMembers').textContent = data.totalMembers ?? 0;
            if (document.getElementById('issuedBooks'))  document.getElementById('issuedBooks').textContent  = data.issuedBooks  ?? 0;
            if (document.getElementById('overdueBooks')) document.getElementById('overdueBooks').textContent = data.overdueBooks ?? 0;

            // Recent Activity
            activityList.innerHTML = `
                <div class="activity-item">
                    <div class="stat-orb orb-yellow orb-sm"><i class="fas fa-book"></i></div>
                    <div><p class="text-bold">Book Issued</p><small class="text-muted">Check Issued Books for latest</small></div>
                </div>
                <div class="activity-item">
                    <div class="stat-orb orb-green orb-sm"><i class="fas fa-users"></i></div>
                    <div><p class="text-bold">Total Members</p><small class="text-muted">${data.totalMembers ?? 0} registered</small></div>
                </div>
            `;

            // Overdue list
            const overdueList = document.getElementById('overdueList');
            if (overdueList) {
                if (data.overdueBooksList && data.overdueBooksList.length > 0) {
                    overdueList.innerHTML = data.overdueBooksList.map(b => `
                        <div class="overdue-item">
                            <div>
                                <strong class="overdue-text">${b.title}</strong>
                                <small class="overdue-subtext">Member: ${b.memberName}</small>
                            </div>
                            <span class="badge-overdue">${b.daysOverdue} days</span>
                        </div>
                    `).join('');
                } else {
                    overdueList.innerHTML = `
                        <div class="text-center mt-2 mb-2">
                            <i class="fas fa-check-circle text-success fs-2rem mb-1"></i>
                            <p class="font-bold">No overdue books!</p>
                        </div>`;
                }
            }

            // Recent books table
            const tbody = document.getElementById('recentBooksTable');
            if (tbody) {
                if (data.recentBooks && data.recentBooks.length > 0) {
                    tbody.innerHTML = data.recentBooks.map(b => `
                        <tr>
                            <td class="font-bold">BK${b.id}</td>
                            <td>${b.title}</td>
                            <td>${b.author}</td>
                            <td>${b.category}</td>
                            <td><span class="badge ${b.quantity < 5 ? 'badge-warning' : 'badge-success'}">${b.quantity}</span></td>
                        </tr>
                    `).join('');
                } else {
                    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No books found</td></tr>';
                }
            }
        })
        .catch(err => {
            console.error('Dashboard fetch error:', err);
            ['totalBooks','totalMembers','issuedBooks','overdueBooks'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = '0';
            });
            if (activityList) activityList.innerHTML = '<div class="text-muted">Could not load activity</div>';
        });
}

// ── ISSUE BOOK FORM ───────────────────────────────────────────────────────
function initIssueBookForm() {
    const issueDateEl = document.getElementById('issue');
    const returnDateEl = document.getElementById('return');
    const form = document.querySelector('form');

    if (issueDateEl) issueDateEl.valueAsDate = new Date();

    if (form && issueDateEl && returnDateEl) {
        form.addEventListener('submit', function(e) {
            const issue = new Date(issueDateEl.value);
            const ret   = new Date(returnDateEl.value);
            if (ret <= issue) {
                e.preventDefault();
                alert('Return date must be after the issue date.');
            }
        });
    }
}

// ── BOOKS PAGE ────────────────────────────────────────────────────────────
function initBooksPage() {
    const role = localStorage.getItem('userRole') || 'user';
    const adminActions = document.getElementById('adminActions');
    if (adminActions && role === 'admin') {
        adminActions.style.display = 'block';
    }
    fetchBooks();
}

function fetchBooks() {
    const tbody = document.getElementById('booksTableBody');
    const count = document.getElementById('bookCount');
    if (!tbody) return;

    fetch('view')
        .then(res => res.json())
        .then(data => {
            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center p-3 text-muted">No books found.</td></tr>';
                if (count) count.textContent = '(0)';
                return;
            }

            if (count) count.textContent = `(${data.length})`;
            tbody.innerHTML = data.map(b => {
                const bgColors = ["#064E3B", "#C2410C", "#B45309", "#1C1917", "#0369A1"];
                const bg = bgColors[b.id % bgColors.length];
                const role = localStorage.getItem('userRole') || 'user';
                const isAdmin = role === 'admin';

                let stockLabel = '';
                if (b.quantity <= 0) {
                    stockLabel = `<span class="badge badge-due">Out of Stock</span>`;
                } else if (b.quantity < 5) {
                    stockLabel = `<span class="badge badge-warning">${b.quantity} Left</span>`;
                } else {
                    stockLabel = `<span class="badge badge-success">Available (${b.quantity})</span>`;
                }

                let actionBtn = '';
                if (isAdmin) {
                    actionBtn = `
                        <div class="flex gap-1">
                            <a href="edit?id=${b.id}" class="lib-btn lib-btn-secondary h-32 px-3 fs-sm"><i class="fas fa-edit mr-1"></i> Edit</a>
                            <button onclick="deleteBook(${b.id}, '${b.title.replace(/'/g, "\\'")}')" class="lib-btn lib-btn-secondary h-32 px-3 fs-sm text-danger"><i class="fas fa-trash"></i></button>
                        </div>
                    `;
                } else {
                    if (b.quantity > 0) {
                        actionBtn = `<a href="user_issuebook.html?bid=${b.id}" class="lib-btn lib-btn-primary h-32 px-3 fs-sm"><i class="fas fa-plus mr-1"></i> Issue</a>`;
                    } else {
                        actionBtn = `<button class="lib-btn lib-btn-secondary h-32 px-3 fs-sm opacity-50 cursor-not-allowed" disabled>Empty</button>`;
                    }
                }

                return `
                    <tr>
                        <td class="p-1 px-4">
                            <div class="flex align-center gap-1">
                                <div class="book-cover-sm" style="background: ${bg};">
                                    <i class="fas fa-book opacity-40"></i>
                                </div>
                                <div>
                                    <div class="font-black text-primary fs-md mb-0">${b.title}</div>
                                    <div class="fs-sm text-muted">${b.author} &bull; BK-${b.id}</div>
                                </div>
                            </div>
                        </td>
                        <td class="font-bold">${b.category}</td>
                        <td>${stockLabel}</td>
                        <td>${actionBtn}</td>
                    </tr>
                `;
            }).join('');
        })
        .catch(err => {
            console.error('Error fetching books:', err);
            tbody.innerHTML = '<tr><td colspan="4" class="text-center p-3 text-muted">Error loading books.</td></tr>';
        });
}

function deleteBook(id, title) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    const formData = new URLSearchParams();
    formData.append('bookId', id);

    fetch('DeleteBook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
    }).then(res => {
        if (res.redirected || res.ok) {
            showToast('Book deleted successfully');
            fetchBooks();
        } else {
            showToast('Failed to delete book', true);
        }
    });
}

// ── MEMBERS PAGE ──────────────────────────────────────────────────────────
function initMembersPage() {
    fetchMembers();
}

function fetchMembers() {
    const tbody = document.getElementById('membersTableBody');
    const count = document.getElementById('memberCount');
    if (!tbody) return;

    fetch('viewmember')
        .then(res => res.json())
        .then(data => {
            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center p-3 text-muted">No members found.</td></tr>';
                if (count) count.textContent = '(0)';
                return;
            }

            if (count) count.textContent = `(${data.length})`;
            tbody.innerHTML = data.map(m => {
                return `
                    <tr>
                        <td class="p-1 px-4">
                            <div class="flex align-center gap-1">
                                <div class="stat-orb orb-sm" style="background: #E5E7EB; color: #4B5563;">
                                    ${m.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div class="font-black text-primary fs-md">${m.name}</div>
                                    <div class="fs-sm text-muted">ID: MEM-${m.id}</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="fs-md font-bold">${m.email}</div>
                            <div class="fs-sm text-muted">${m.phone}</div>
                        </td>
                        <td>
                            <span class="badge" style="background: ${m.role === 'admin' ? 'rgba(124, 58, 237, 0.1)' : 'rgba(75, 85, 99, 0.1)'}; color: ${m.role === 'admin' ? '#7C3AED' : '#4B5563'};">
                                ${m.role}
                            </span>
                        </td>
                        <td>
                            <a href="editmember?id=${m.id}" class="lib-btn lib-btn-secondary h-32 px-3 fs-sm"><i class="fas fa-edit mr-1"></i> Edit</a>
                        </td>
                    </tr>
                `;
            }).join('');
        })
        .catch(err => {
            console.error('Error fetching members:', err);
            tbody.innerHTML = '<tr><td colspan="4" class="text-center p-3 text-muted">Error loading members.</td></tr>';
        });
}

// ── ISSUED BOOKS PAGE ─────────────────────────────────────────────────────
let allRecords = [];
function initIssuedBooksPage() {
    fetchIssued();
}

function fetchIssued() {
    const tbody = document.getElementById('issuedTableBody');
    if (!tbody) return;

    fetch('IssuedBook') 
        .then(res => res.json())
        .then(data => {
            allRecords = data;
            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center p-3 text-muted">No issue records found.</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(record => {
                let statusHtml = '';
                if (record.returned) {
                    statusHtml = `<span class="badge badge-success">Returned</span>`;
                } else {
                    const today = new Date();
                    const returnBy = new Date(record.returnDate);
                    if (returnBy < today) {
                        statusHtml = `<span class="badge badge-due" style="background: rgba(239, 68, 68, 0.1); color: #EF4444;">Overdue</span>`;
                    } else {
                        statusHtml = `<span class="badge badge-warning" style="background: rgba(245, 158, 11, 0.1); color: #F59E0B;">Active</span>`;
                    }
                }

                return `
                    <tr>
                        <td class="p-1 px-4">
                            <div class="font-black text-primary fs-md">${record.bookTitle}</div>
                            <div class="fs-sm text-muted">BK-${record.bookId}</div>
                        </td>
                        <td>
                            <div class="font-bold">${record.memberName}</div>
                            <div class="fs-sm text-muted">MEM-${record.memberId}</div>
                        </td>
                        <td>${record.issueDate}</td>
                        <td>${record.returnDate}</td>
                        <td>
                            <div class="flex align-center gap-1">
                                ${statusHtml}
                                <button onclick="showDetails(${record.id})" class="lib-btn lib-btn-secondary h-32 w-32 p-0 flex align-center justify-center rounded-full" title="Details">
                                    <i class="fas fa-eye fs-sm"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        });
}

function showDetails(id) {
    const r = allRecords.find(x => x.id === id);
    if (!r) return;

    const content = document.getElementById('modalContent');
    const actions = document.getElementById('modalActions');
    if (!content || !actions) return;
    
    content.innerHTML = `
        <div class="lib-table-container">
            <table class="lib-table w-full">
                <tr><th>Book</th><td>${r.bookTitle} (ID: ${r.bookId})</td></tr>
                <tr><th>Member</th><td>${r.memberName} (ID: ${r.memberId})</td></tr>
                <tr><th>Issued On</th><td>${r.issueDate}</td></tr>
                <tr><th>Return By</th><td>${r.returnDate}</td></tr>
                <tr><th>Status</th><td>${r.returned ? 'Returned' : 'Active'}</td></tr>
            </table>
        </div>
    `;

    if (!r.returned) {
        actions.innerHTML = `<a href="ReturnBookServlet?id=${r.id}" class="lib-btn lib-btn-primary w-full text-center block">Return Book</a>`;
    } else {
        actions.innerHTML = '';
    }

    const modal = document.getElementById('detailModal');
    const overlay = document.getElementById('modalOverlay');
    if (modal) modal.style.display = 'block';
    if (overlay) overlay.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('detailModal');
    const overlay = document.getElementById('modalOverlay');
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
}

function showToast(message, isError = false) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast' + (isError ? ' error' : '');
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(110%)';
        setTimeout(() => toast.remove(), 300);
    }, 2200);
}

// Dynamic Navbar Renderer
function renderNavbar(active) {
    const navContainer = document.getElementById('navLinks');
    if (!navContainer) return;

    const role = localStorage.getItem('userRole') || 'user';
    const isAdmin = role === 'admin';

    let links = '';
    if (isAdmin) {
        links = `
            <a href="index.html" class="nav-link ${active === 'dashboard' ? 'active' : ''}"><i class="fas fa-home"></i> Dashboard</a>
            <a href="books.html" class="nav-link ${active === 'books' ? 'active' : ''}"><i class="fas fa-book"></i> Books</a>
            <a href="members.html" class="nav-link ${active === 'members' ? 'active' : ''}"><i class="fas fa-users"></i> Members</a>
            <a href="issued_books.html" class="nav-link ${active === 'issued' ? 'active' : ''}"><i class="fas fa-exchange-alt"></i> Issued Books</a>
        `;
    } else {
        links = `
            <a href="user_dashboard.html" class="nav-link ${active === 'dashboard' ? 'active' : ''}"><i class="fas fa-home"></i> Home</a>
            <a href="books.html" class="nav-link ${active === 'books' ? 'active' : ''}"><i class="fas fa-book"></i> View Books</a>
            <a href="user_issuebook.html" class="nav-link ${active === 'issue' ? 'active' : ''}"><i class="fas fa-book-open"></i> Issue Book</a>
            <a href="ReturnBookServlet" class="nav-link ${active === 'return' ? 'active' : ''}"><i class="fas fa-undo"></i> Return Book</a>
            <a href="issued_books.html" class="nav-link ${active === 'issued' ? 'active' : ''}"><i class="fas fa-list"></i> My Books</a>
        `;
    }

    links += `<a href="LogoutServlet" class="lib-btn lib-btn-secondary nav-logout"><i class="fas fa-sign-out-alt"></i> Logout</a>`;
    navContainer.innerHTML = links;
}