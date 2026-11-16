// Fetch customer data from PHP
fetch('editPersonalDetails.php')
.then(response => {
    if (!response.ok) {
        return response.json().then(err => { throw err; });
    }
    return response.json();
})
.then(customer => {
    if (customer.error) throw customer;

    // Populate input fields
    document.getElementById('fullname').value = customer.full_name;
    document.getElementById('contact').value = customer.contact_no;
    document.getElementById('address').value = customer.home_address;

    const editBtn = document.getElementById('editBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const defaultButtons = document.getElementById('defaultButtons');
    const editButtons = document.getElementById('editButtons');
    const inputs = document.querySelectorAll('input');

    const originalValues = {};
    inputs.forEach(input => originalValues[input.id] = input.value);

    editBtn.addEventListener('click', () => {
        inputs.forEach(input => input.removeAttribute('readonly'));
        defaultButtons.classList.add('hidden');
        editButtons.classList.remove('hidden');
    });

    cancelBtn.addEventListener('click', () => {
        inputs.forEach(input => {
            input.value = originalValues[input.id];
            input.setAttribute('readonly', true);
        });
        defaultButtons.classList.remove('hidden');
        editButtons.classList.add('hidden');
    });

    // Save button logic (optional: POST back to PHP via fetch)
    document.getElementById('saveBtn').addEventListener('click', (e) => {
        e.preventDefault();
        const data = {
            full_name: document.getElementById('fullname').value,
            contact_no: document.getElementById('contact').value,
            home_address: document.getElementById('address').value
        };

        fetch('updatePersonalDetails.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        })
        .then(resp => resp.json())
        .then(res => {
            if (res.success) {
                alert('Details updated successfully!');
                // Update originalValues
                Object.keys(data).forEach(key => originalValues[key] = data[key]);
                inputs.forEach(input => input.setAttribute('readonly', true));
                defaultButtons.classList.remove('hidden');
                editButtons.classList.add('hidden');
            } else {
                alert(res.error || 'Failed to update details.');
            }
        })
        .catch(err => console.error('Error updating details:', err));
    });
})
.catch(err => {
    console.error('Error fetching customer data:', err);

    // Disable all input fields and buttons
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => input.setAttribute('readonly', true));

    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    editBtn.disabled = true;
    saveBtn.disabled = true;
    cancelBtn.disabled = true;

    // Show error message
    const container = document.querySelector('.details-container');
    const message = document.createElement('p');
    message.style.color = 'red';
    message.textContent = 'You are not logged in. Please log in to view and edit your details.';
    container.prepend(message);
});