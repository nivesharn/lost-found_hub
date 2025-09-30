// js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    // Get modal elements
    const actionModal = document.getElementById('actionModal');
    const closeButton = actionModal ? actionModal.querySelector('.close-button') : null;
    const confirmActionButton = document.getElementById('confirmActionButton');
    const cancelActionButton = document.getElementById('cancelActionButton');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');

    // Store the action to be performed when confirm is clicked
    let currentAction = null;
    let currentItemId = null; // To store the ID of the item being acted upon

    // Function to show the modal
    const showActionModal = (title, message, actionType, itemId) => {
        if (actionModal) {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            currentAction = actionType; // e.g., 'deleteItem', 'markResolved'
            currentItemId = itemId;
            actionModal.style.display = 'block';
            // Optional: add a class for CSS transitions
            actionModal.classList.add('is-visible');
        }
    };

    // Function to hide the modal
    const hideActionModal = () => {
        if (actionModal) {
            actionModal.style.display = 'none';
            // Optional: remove the class for CSS transitions
            actionModal.classList.remove('is-visible');
            currentAction = null; // Clear the action
            currentItemId = null; // Clear the item ID
        }
    };

    // Event listeners for modal close buttons
    if (closeButton) {
        closeButton.addEventListener('click', hideActionModal);
    }

    if (cancelActionButton) {
        cancelActionButton.addEventListener('click', hideActionModal);
    }

    // Event listener for the Confirm button
    if (confirmActionButton) {
        confirmActionButton.addEventListener('click', () => {
            if (currentAction === 'deleteItem') {
                // Perform delete logic here
                console.log(`Deleting item with ID: ${currentItemId}`);
                // Call a function to delete the item via API
                // Then refresh the table or remove the row
                alert(`Item ${currentItemId} deleted (simulated).`);
            } else if (currentAction === 'markResolved') {
                // Perform mark resolved logic here
                console.log(`Marking item with ID: ${currentItemId} as Resolved`);
                // Call a function to update item status via API
                // Then refresh the table
                alert(`Item ${currentItemId} marked as Resolved (simulated).`);
            }
            // Add more actions as needed
            hideActionModal(); // Always hide the modal after confirming
        });
    }

    // --- Example: How to trigger the modal from your table actions ---
    // You'll need to listen for clicks on your table's action buttons (e.g., Delete, Resolve).
    // This uses event delegation because table rows/buttons might be added dynamically.

    const adminItemsTableBody = document.querySelector('#adminItemsTable tbody');
    if (adminItemsTableBody) {
        adminItemsTableBody.addEventListener('click', (event) => {
            // Check if a delete button was clicked
            if (event.target.classList.contains('delete-item-btn')) {
                const itemId = event.target.dataset.itemId; // Assuming you set data-item-id on your delete buttons
                showActionModal(
                    'Confirm Deletion',
                    `Are you sure you want to delete item ID ${itemId}? This action cannot be undone.`,
                    'deleteItem',
                    itemId
                );
            }
            // Check if a resolve button was clicked
            if (event.target.classList.contains('resolve-item-btn')) {
                const itemId = event.target.dataset.itemId; // Assuming you set data-item-id on your resolve buttons
                showActionModal(
                    'Confirm Resolution',
                    `Are you sure you want to mark item ID ${itemId} as Resolved?`,
                    'markResolved',
                    itemId
                );
            }
            // Add more action button types as needed
        });
    }

    // --- Other dashboard logic (from your previous code) ---

    // Example for fetching and displaying items (assuming this is in admin.js)
    const adminSearchKeyword = document.getElementById('adminSearchKeyword');
    const adminSearchBtn = document.getElementById('adminSearchBtn');
    const adminItemTypeFilter = document.getElementById('adminItemTypeFilter');
    const adminItemStatusFilter = document.getElementById('adminItemStatusFilter');
    const adminResetFiltersBtn = document.getElementById('adminResetFiltersBtn');
    const adminItemsTable = document.getElementById('adminItemsTable');
    const adminClaimsTable = document.getElementById('adminClaimsTable');
    const noAdminItemsMessage = document.getElementById('noAdminItemsMessage');
    const noAdminClaimsMessage = document.getElementById('noAdminClaimsMessage');

    const fetchAdminItems = async () => {
        // console.log("Fetching admin items...");
        // Simulate API call
        const loadingRow = adminItemsTable.querySelector('.loading-message');
        if (loadingRow) loadingRow.textContent = 'Loading items...';

        try {
            // In a real app, this would be a fetch() call to your backend
            // const response = await fetch('/api/admin/items?...');
            // const data = await response.json();
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

            const dummyData = [
                { id: 1, type: 'Found', name: 'Blue Water Bottle', category: 'Drinkware', location: 'Library', date: '2025-06-01', reporter: 'user1@example.com', status: 'Active' },
                { id: 2, type: 'Lost', name: 'Keys with Batman Keychain', category: 'Keys', location: 'Cafeteria', date: '2025-05-28', reporter: 'user2@example.com', status: 'Active' },
                { id: 3, type: 'Found', name: 'Laptop Charger (Dell)', category: 'Electronics', location: 'Lab 203', date: '2025-06-03', reporter: 'user3@example.com', status: 'Claimed' },
                 { id: 4, type: 'Found', name: 'Black Backpack', category: 'Bags', location: 'Gym', date: '2025-06-05', reporter: 'user4@example.com', status: 'Resolved' },
                { id: 5, type: 'Lost', name: 'Science Textbook', category: 'Books', location: 'Lecture Hall 1', date: '2025-06-02', reporter: 'user5@example.com', status: 'Active' }
            ];

            let filteredItems = dummyData;

            const keyword = adminSearchKeyword.value.toLowerCase();
            const typeFilter = adminItemTypeFilter.value;
            const statusFilter = adminItemStatusFilter.value;

            if (keyword) {
                filteredItems = filteredItems.filter(item =>
                    item.name.toLowerCase().includes(keyword) ||
                    item.location.toLowerCase().includes(keyword)
                );
            }
            if (typeFilter) {
                filteredItems = filteredItems.filter(item => item.type === typeFilter);
            }
            if (statusFilter) {
                filteredItems = filteredItems.filter(item => item.status === statusFilter);
            }

            renderAdminItemsTable(filteredItems);

        } catch (error) {
            console.error('Error fetching admin items:', error);
            const tbody = adminItemsTable.querySelector('tbody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="error-message">Failed to load items. Please try again.</td></tr>';
        }
    };

    const renderAdminItemsTable = (items) => {
        const tbody = adminItemsTable.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = ''; // Clear existing rows

        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="info-message">No items found matching your criteria.</td></tr>';
            noAdminItemsMessage.style.display = 'block';
        } else {
            noAdminItemsMessage.style.display = 'none';
            items.forEach(item => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${item.id}</td>
                    <td>${item.type}</td>
                    <td>${item.name}</td>
                    <td>${item.category}</td>
                    <td>${item.location}</td>
                    <td>${item.date}</td>
                    <td>${item.reporter}</td>
                    <td>${item.status}</td>
                    <td>
                        <button class="btn btn-sm btn-info view-item-btn" data-item-id="${item.id}">View</button>
                        ${item.status !== 'Resolved' ? `<button class="btn btn-sm btn-success resolve-item-btn" data-item-id="${item.id}">Resolve</button>` : ''}
                        <button class="btn btn-sm btn-danger delete-item-btn" data-item-id="${item.id}">Delete</button>
                    </td>
                `;
            });
        }
    };

    const fetchAdminClaims = async () => {
        // console.log("Fetching admin claims...");
        // Simulate API call
        const loadingRow = adminClaimsTable.querySelector('.loading-message');
        if (loadingRow) loadingRow.textContent = 'Loading claims...';

        try {
            // In a real app, this would be a fetch() call to your backend
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

            const dummyClaims = [
                { id: 101, itemId: 3, itemName: 'Laptop Charger (Dell)', claimant: 'claimant123', details: 'Lost it in Lab 203 yesterday.', claimedAt: '2025-06-04 10:00', status: 'Pending' },
                { id: 102, itemId: 2, itemName: 'Keys with Batman Keychain', claimant: 'finder456', details: 'I found them near the cafeteria entrance.', claimedAt: '2025-05-29 14:30', status: 'Approved' }
            ];

            renderAdminClaimsTable(dummyClaims);

        } catch (error) {
            console.error('Error fetching admin claims:', error);
            const tbody = adminClaimsTable.querySelector('tbody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="error-message">Failed to load claims.</td></tr>';
        }
    };

    const renderAdminClaimsTable = (claims) => {
        const tbody = adminClaimsTable.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = ''; // Clear existing rows

        if (claims.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="info-message">No claims found.</td></tr>';
            noAdminClaimsMessage.style.display = 'block';
        } else {
            noAdminClaimsMessage.style.display = 'none';
            claims.forEach(claim => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${claim.id}</td>
                    <td>${claim.itemName}</td>
                    <td>${claim.claimant}</td>
                    <td>${claim.details}</td>
                    <td>${claim.claimedAt}</td>
                    <td>${claim.status}</td>
                    <td>
                        <button class="btn btn-sm btn-info view-claim-btn" data-claim-id="${claim.id}">View</button>
                        ${claim.status === 'Pending' ? `<button class="btn btn-sm btn-success approve-claim-btn" data-claim-id="${claim.id}">Approve</button>` : ''}
                        ${claim.status === 'Pending' ? `<button class="btn btn-sm btn-danger reject-claim-btn" data-claim-id="${claim.id}">Reject</button>` : ''}
                    </td>
                `;
            });
        }
    };

    // Event Listeners for Filters and Search
    if (adminSearchBtn) adminSearchBtn.addEventListener('click', fetchAdminItems);
    if (adminSearchKeyword) adminSearchKeyword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') fetchAdminItems();
    });
    if (adminItemTypeFilter) adminItemTypeFilter.addEventListener('change', fetchAdminItems);
    if (adminItemStatusFilter) adminItemStatusFilter.addEventListener('change', fetchAdminItems);
    if (adminResetFiltersBtn) adminResetFiltersBtn.addEventListener('click', () => {
        adminSearchKeyword.value = '';
        adminItemTypeFilter.value = '';
        adminItemStatusFilter.value = '';
        fetchAdminItems();
    });

    // Initial fetch of items and claims when the page loads
    fetchAdminItems();
    fetchAdminClaims();

    // Logout button handler
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // In a real application, you would clear session/local storage tokens
            alert('Logged out successfully!');
            window.location.href = '../login.html'; // Redirect to login page
        });
    }

    // Hamburger menu (assuming this is in main.js or a global script)
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const navUl = document.querySelector('nav ul');

    if (hamburgerMenu && navUl) {
        hamburgerMenu.addEventListener('click', () => {
            navUl.classList.toggle('active');
        });
    }
});