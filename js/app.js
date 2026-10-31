// ==========================================
// DARK MODE TOGGLE (Works on all pages)
// ==========================================
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    // Check local storage for theme
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
        themeToggle.textContent = '☀';
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        if (document.body.classList.contains('dark')) {
            localStorage.setItem('theme', 'dark');
            themeToggle.textContent = '☀';
        } else {
            localStorage.setItem('theme', 'light');
            themeToggle.textContent = '⏾';
        }
    });
}

// ==========================================
// NAVBAR AUTHENTICATION STATUS
// ==========================================
function updateNavbarAuth() {
    const authLink = document.getElementById('navAuthLink');
    const myBookingsLink = document.getElementById('navMyBookings');
    
    if (!authLink) return;

    const currentUser = localStorage.getItem('azoom_user');

    if (currentUser) {
        authLink.textContent = 'Logout';
        authLink.href = '#'; 
        
        // Show My Bookings
        if (myBookingsLink) myBookingsLink.style.display = 'block';

        authLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('azoom_user');
            window.location.href = 'index.html';
        });
    } else {
        // User logged out
        authLink.textContent = 'Login';
        authLink.href = 'login.html';
        if (myBookingsLink) myBookingsLink.style.display = 'none';
    }
}
updateNavbarAuth();

// ==========================================
// RENDER CARS & FILTER ON cars.html
// ==========================================
const allCarsGrid = document.getElementById('allCarsGrid');

if (allCarsGrid) {
    const displayCars = (filter) => {
        allCarsGrid.innerHTML = ''; 
        const safeFilter = filter.trim().toLowerCase();

        let filteredCars;
        if (safeFilter === 'all') {
            filteredCars = carData;
        } else {
            filteredCars = carData.filter(car => car.type.toLowerCase() === safeFilter);
        }

        filteredCars.forEach(car => {
            const card = document.createElement('article');
            card.className = 'car-card';
            card.innerHTML = `
                <img src="${car.image}" alt="${car.name}">
                <h3>${car.name}</h3>
                <p>From $${car.price} / day</p>
                <a href="rent.html?id=${car.id}" class="btn">Rent Now</a>
            `;
            allCarsGrid.appendChild(card);
        });
    };

    const filterButtons = document.querySelectorAll('.filter-btn');
    const urlParams = new URLSearchParams(window.location.search);

    let urlFilter = urlParams.get('filter'); 

    let initialFilter = 'All'; // Default

    if (urlFilter) {

        filterButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-filter').toLowerCase() === urlFilter.toLowerCase()) {
                btn.classList.add('active');
                initialFilter = btn.getAttribute('data-filter');
            }
        });
    } else {
        // If no URL filter, default to the "All" button
        filterButtons.forEach(btn => btn.classList.remove('active'));
        const defaultBtn = document.querySelector('[data-filter="All"]');
        if (defaultBtn) defaultBtn.classList.add('active');
    }

    // Load the correct cars when the page opens
    displayCars(initialFilter);

    // Add click events to the filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const clickedButton = e.currentTarget; 
            filterButtons.forEach(btn => btn.classList.remove('active'));
            clickedButton.classList.add('active');
            const filterType = clickedButton.getAttribute('data-filter');
            displayCars(filterType);
        });
    });
}

// ==========================================
// LOAD SPECIFIC CAR ON rent.html
// ==========================================
const rentCarDetails = document.getElementById('rentCarDetails');
if (rentCarDetails) {
    // Get the car ID from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const carId = parseInt(urlParams.get('id'));

    const selectedCar = carData.find(car => car.id === carId);

    if (selectedCar) {
        // Display car details
        rentCarDetails.innerHTML = `
            <img src="${selectedCar.image}" alt="${selectedCar.name}">
            <h2>${selectedCar.name}</h2>
            <p><strong>Type:</strong> ${selectedCar.type} | <strong>Seats:</strong> ${selectedCar.seats} | <strong>Transmission:</strong> ${selectedCar.transmission}
            | <strong>Engine Type:</strong> ${selectedCar.engineType}</p>
            <h3 style="color: orange; margin-top: 10px;">$${selectedCar.price} / day</h3>
        `;
    } else {
        rentCarDetails.innerHTML = `<p>Car not found. Please go back.</p>`;
    }
}

// ==========================================
// PAYMENT & BOOKING RECEIPT rent.html
// ==========================================
const reserveForm = document.getElementById('reserveForm');

if (reserveForm) {
    const urlParams = new URLSearchParams(window.location.search);
    const carId = parseInt(urlParams.get('id'));
    
    const receiptPanel = document.getElementById('receiptPanel');
    const pageTitle = document.getElementById('pageTitle');

    const loggedInUser = localStorage.getItem('azoom_user');
    if (loggedInUser) {
        document.getElementById('custEmail').value = loggedInUser;
    }

    // NEW: DYNAMIC PRICE CALCULATION
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const priceSummary = document.getElementById('priceSummary');
    const totalPriceAmount = document.getElementById('totalPriceAmount');
    
    // Find the car to get its daily price
    const currentCar = carData.find(c => c.id === carId);

    function calculateTotal() {
        if (!startDateInput.value || !endDateInput.value) return;

        const start = new Date(startDateInput.value);
        const end = new Date(endDateInput.value);

        if (end < start) {
            totalPriceAmount.textContent = "Invalid Dates";
            totalPriceAmount.style.color = "red";
            priceSummary.style.display = 'flex';
            return;
        }

        // Calculate days
        let days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        if (days <= 0) days = 1;

        const total = days * currentCar.price;
        
        totalPriceAmount.textContent = `$${total} (${days} day${days > 1 ? 's' : ''})`;
        totalPriceAmount.style.color = "orange";
        priceSummary.style.display = 'flex';
    }

    startDateInput.addEventListener('change', calculateTotal);
    endDateInput.addEventListener('change', calculateTotal);

    // Handle the Payment Submission
    reserveForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const expiryValue = document.getElementById('cardExpiry').value;
        const expiryError = document.getElementById('expiryError');
        const expiryInput = document.getElementById('cardExpiry');

        if (!/^\d{2}\/\d{2}$/.test(expiryValue)) {
            expiryError.textContent = "Please enter a valid date (MM/YY).";
            expiryError.style.display = 'block';
            expiryInput.style.borderColor = 'red';
            return; 
        }

        const expMonth = parseInt(expiryValue.split('/')[0]);
        const expYear = parseInt("20" + expiryValue.split('/')[1]); // Convert YY to 20YY
        
        const today = new Date();
        const currentMonth = today.getMonth() + 1; 
        const currentYear = today.getFullYear();

        // Check if the card is expired 
        if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
            expiryError.textContent = "Please enter a valid expiry date.";
            expiryError.style.display = 'block';
            expiryInput.style.borderColor = 'red';
            return;
        }

        // If valid, hide error and reset border color
        expiryError.style.display = 'none';
        expiryInput.style.borderColor = '';

        const customerName = document.getElementById('custName').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const pickup = document.getElementById('pickupLocation').value;
        const returnLoc = document.getElementById('returnLocation').value;
        
        // Get the car details
        const car = carData.find(c => c.id === carId);
        
        // Create a new booking object
        const newBooking = {
            bookingId: "B-" + Math.floor(1000 + Math.random() * 9000),
            carId: car.id,
            carName: car.name,
            pricePerDay: car.price,
            customerName: customerName,
            customerEmail: document.getElementById('custEmail').value, 
            startDate: startDate,
            endDate: endDate,
            pickup: pickup,
            returnLoc: returnLoc,
            status: 'Reserved',
            damageCost: 0,
            finalTotal: 0
        };

        // Save to localStorage database
        let allBookings = JSON.parse(localStorage.getItem('azoom_bookings')) || [];
        allBookings.push(newBooking);
        localStorage.setItem('azoom_bookings', JSON.stringify(allBookings));
        
        // Hide the form and show receipt
        reserveForm.style.display = 'none';
        pageTitle.style.display = 'none';
        receiptPanel.style.display = 'block';
        
        document.getElementById('receiptName').textContent = customerName;
        document.getElementById('receiptPickup').textContent = pickup;
        document.getElementById('receiptReturn').textContent = returnLoc;
    });
}

// ==========================================
// AUTHENTICATION (CUSTOMER & STAFF LOGIN)
// ==========================================

// Route Protection for rent
if (window.location.pathname.includes('rent.html')) {
    const currentUser = localStorage.getItem('azoom_user');
    if (!currentUser) {
        const intendedUrl = window.location.pathname + window.location.search;
        window.location.href = `login.html?redirect=${encodeURIComponent(intendedUrl)}`;
    }
}

// Login/Signup Page
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    let currentRole = 'customer';
    let isSignupMode = false;
    
    const tabCustomer = document.getElementById('tabCustomer');
    const tabStaff = document.getElementById('tabStaff');
    const submitBtn = document.getElementById('loginSubmitBtn');
    const btnLoginMode = document.getElementById('btnLoginMode');
    const btnSignupMode = document.getElementById('btnSignupMode');

    // Role Switch
    tabCustomer.addEventListener('click', () => {
        currentRole = 'customer';
        tabCustomer.classList.add('active');
        tabStaff.classList.remove('active');
        document.getElementById('btnLoginMode').parentElement.style.display = 'flex';
        document.getElementById('staffDemoBox').style.display = 'none'; // Hide box
    });

    tabStaff.addEventListener('click', () => {
        currentRole = 'staff';
        tabStaff.classList.add('active');
        tabCustomer.classList.remove('active');
        document.getElementById('btnLoginMode').parentElement.style.display = 'none';
        isSignupMode = false;
        submitBtn.textContent = 'Login';
        document.getElementById('staffDemoBox').style.display = 'block'; // Show box
    });

    // Login vs Signup 
    btnLoginMode.addEventListener('click', () => {
        isSignupMode = false;
        btnLoginMode.classList.add('active');
        btnSignupMode.classList.remove('active');
        submitBtn.textContent = 'Login';
    });

    btnSignupMode.addEventListener('click', () => {
        isSignupMode = true;
        btnSignupMode.classList.add('active');
        btnLoginMode.classList.remove('active');
        submitBtn.textContent = 'Create Account';
    });

        // Form Submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPass').value;
        const msgBox = document.getElementById('authMessage');
        
        if (currentRole === 'staff') {
            // Check for the permanent demo staff account
            if (email === 'azoomemp@az.com' && password === 'az1') {
                localStorage.setItem('azoom_staff', 'true');
                window.location.href = 'staff.html'; 
            } else {
                msgBox.textContent = "Invalid staff credentials.";
                msgBox.className = "auth-message error";
                msgBox.style.display = "block";
            }
            return;
        }

        // Get existing users array from localStorage
        let users = JSON.parse(localStorage.getItem('azoom_users')) || [];

        if (isSignupMode) {
            // SIGN UP
            if (users.find(u => u.email === email)) {
                msgBox.textContent = "An account with this email already exists. Please log in.";
                msgBox.className = "auth-message error";
                msgBox.style.display = "block";
                return;
            }
            
            users.push({ email: email, password: password });
            localStorage.setItem('azoom_users', JSON.stringify(users));
            
            msgBox.textContent = "Account created successfully! Logging you in...";
            msgBox.className = "auth-message success";
            msgBox.style.display = "block";
            
            setTimeout(() => {
                localStorage.setItem('azoom_user', email);
                redirectAfterLogin();
            }, 1500);
            return;
            
        } else {
            // LOGIN LOGIC 
            const user = users.find(u => u.email === email && u.password === password);
            if (!user) {
                msgBox.textContent = "Invalid email or password. Please try again.";
                msgBox.className = "auth-message error";
                msgBox.style.display = "block";
                return;
            }
        }

        // If successful login
        localStorage.setItem('azoom_user', email);
        redirectAfterLogin();
    });

    function redirectAfterLogin() {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect');
        window.location.href = redirectUrl ? redirectUrl : 'index.html';
    }

    // Hide message when user types or switches tabs
    document.getElementById('loginEmail').addEventListener('input', () => {
        document.getElementById('authMessage').style.display = 'none';
    });
    document.getElementById('loginPass').addEventListener('input', () => {
        document.getElementById('authMessage').style.display = 'none';
    });
}

// ==========================================
// CREDIT CARD AUTO-FORMATTING
// ==========================================
const creditCardInput = document.getElementById('creditCard');

if (creditCardInput) {
    creditCardInput.addEventListener('input', function (e) {
        let value = this.value.replace(/\D/g, '');
        
        //Limit to 16 digits 
        value = value.substring(0, 16);
        
        //Add a space after every 4 digits
        let formattedValue = value.match(/.{1,4}/g);
        if (formattedValue) {
            formattedValue = formattedValue.join(' ');
        } else {
            formattedValue = '';
        }
        
        this.value = formattedValue;
    });
}


// ==========================================
// STAFF DASHBOARD LOGIC staff.html
// ==========================================
const staffDashboard = document.getElementById('staffDashboard');

if (staffDashboard) {
    if (localStorage.getItem('azoom_staff') !== 'true') {
        window.location.href = 'login.html'; 
    }

    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('azoom_staff');
        window.location.href = 'index.html';
    });

    function renderStaffDashboard() {
        let bookings = JSON.parse(localStorage.getItem('azoom_bookings')) || [];
        
        if (bookings.length === 0) {
            staffDashboard.innerHTML = `<p style="text-align:center;">No active bookings found.</p>`;
            return;
        }

        staffDashboard.innerHTML = '';

        bookings.forEach((booking, index) => {
            const card = document.createElement('div');
            card.className = 'staff-card';
            
            let actionButtons = '';

            if (booking.status === 'Reserved') {
                actionButtons = `<button class="btn btn-action btn-rent" onclick="updateBooking(${index}, 'Rented')">Approve Rent</button>`;
            
            } else if (booking.status === 'Rented') {
                actionButtons = `<button class="btn btn-action btn-return" onclick="updateBooking(${index}, 'Returned')">Mark as Returned</button>`;
            
            } else if (booking.status === 'Returned') {
                actionButtons = `
                    <div class="inline-inspection">
                        <label style="font-weight: bold; margin-right: 10px;">Damage Cost ($):</label>
                        <input type="number" id="damage-${index}" value="0" min="0" step="0.01" class="inline-input">
                        <button class="btn btn-action btn-inspect" onclick="submitInspection(${index})">Save Inspection</button>
                    </div>
                `;
            
            } else if (booking.status === 'Inspected') {
                // Calculate bill inline
                const start = new Date(booking.startDate);
                const end = new Date(booking.endDate);
                let days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                if (days <= 0) days = 1;
                const rentalCost = days * booking.pricePerDay;
                const total = rentalCost + booking.damageCost;

                actionButtons = `
                    <div class="inline-bill">
                        <div class="bill-breakdown">
                            <span>Rental: ${days} days × $${booking.pricePerDay} = $${rentalCost}</span>
                            <span>Damages: $${booking.damageCost}</span>
                            <strong>Total: $${total}</strong>
                        </div>

                        <button class="btn btn-action" style="background-color: #ccc; color: #666; cursor: not-allowed;" disabled>
                            Awaiting Customer Payment...
                        </button>
                    </div>
                `;
            } else if (booking.status === 'Completed') {
                actionButtons = `<p style="color: #10b981; font-weight: bold;">✅ Fully Paid & Completed (Total: $${booking.finalTotal})</p>`;
            }

            card.innerHTML = `
                <div class="staff-card-header">
                    <h3>${booking.carName} <span class="status-badge status-${booking.status.toLowerCase()}">${booking.status}</span></h3>
                    <p><strong>Booking ID:</strong> ${booking.bookingId} | <strong>Customer:</strong> ${booking.customerName}</p>
                </div>
                <div class="staff-card-details">
                    <p><strong>Dates:</strong> ${booking.startDate} to ${booking.endDate} ($${booking.pricePerDay}/day)</p>
                    <p><strong>Pick-up:</strong> ${booking.pickup}</p>
                    <p><strong>Return:</strong> ${booking.returnLoc}</p>
                </div>
                <div class="staff-card-actions">
                    ${actionButtons}
                </div>
            `;
            staffDashboard.appendChild(card);
        });
    }

    //Button Actions
    window.updateBooking = function(index, newStatus) {
        let bookings = JSON.parse(localStorage.getItem('azoom_bookings'));
        bookings[index].status = newStatus;
        localStorage.setItem('azoom_bookings', JSON.stringify(bookings));
        renderStaffDashboard();
    };

    window.submitInspection = function(index) {
        let bookings = JSON.parse(localStorage.getItem('azoom_bookings'));
        
        //Get the value from the inline input
        const damageInput = document.getElementById(`damage-${index}`);
        const damageNum = parseFloat(damageInput.value);

        if (isNaN(damageNum) || damageNum < 0) {
            damageInput.style.borderColor = 'red'; // Visual error cue instead of alert
            return;
        }

        bookings[index].damageCost = damageNum;
        bookings[index].status = 'Inspected';
        localStorage.setItem('azoom_bookings', JSON.stringify(bookings));
        renderStaffDashboard();
    };
    renderStaffDashboard();
}

// ==========================================
// CUSTOMER MY BOOKINGS PAGE
// ==========================================
const customerBookingsList = document.getElementById('customerBookingsList');

if (customerBookingsList) {
    const currentUser = localStorage.getItem('azoom_user');
    
    // If not logged in, go to login page
    if (!currentUser) {
        window.location.href = 'login.html';
    }

    function renderCustomerBookings() {
        let allBookings = JSON.parse(localStorage.getItem('azoom_bookings')) || [];
        
        const myBookings = allBookings.filter(b => b.customerEmail === currentUser);

        if (myBookings.length === 0) {
            customerBookingsList.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <h3>No bookings found.</h3>
                    <p style="margin-top: 10px;">Looks like you haven't rented a car yet.</p>
                    <a href="cars.html" class="btn" style="margin-top: 20px; display: inline-block;">Browse Cars</a>
                </div>
            `;
            return;
        }

        customerBookingsList.innerHTML = '';

        myBookings.forEach(booking => {
            const card = document.createElement('div');
            card.className = 'staff-card';
            
            let billDisplay = `<p><strong>Status:</strong> ${booking.status}</p>`;

            // show the bill and the Pay button to the customer once inspected
            if (booking.status === 'Inspected') {
                const start = new Date(booking.startDate);
                const end = new Date(booking.endDate);
                let days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                if (days <= 0) days = 1;
                const rentalCost = days * booking.pricePerDay;
                const total = rentalCost + booking.damageCost;

                billDisplay = `
                    <div class="customer-bill-box">
                        <h4>Final Payment</h4>
                        <p>Rental: ${days} days × $${booking.pricePerDay} = $${rentalCost}</p>
                        <p>Damage Fee: $${booking.damageCost}</p>
                        <h3>Total: $${total}</h3>
                        <button class="btn" onclick="payCustomerBill('${booking.bookingId}', ${total})">Pay </button>
                    </div>
                `;
            } else if (booking.status === 'Completed') {
                billDisplay = `
                    <div class="customer-success-box">
                        <h4>✅ Payment Successful!</h4>
                        <p>Thank you for renting with AZoom. We hope you had a great journey!</p>
                        <p style="margin-top: 10px;"><strong>Total Paid:</strong> $${booking.finalTotal}</p>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="staff-card-header">
                    <h3>${booking.carName} <span class="status-badge status-${booking.status.toLowerCase()}">${booking.status}</span></h3>
                    <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
                </div>
                <div class="staff-card-details">
                    <p><strong>Dates:</strong> ${booking.startDate} to ${booking.endDate}</p>
                    <p><strong>Pick-up:</strong> ${booking.pickup}</p>
                    <p><strong>Return:</strong> ${booking.returnLoc}</p>
                </div>
                <div style="margin-top: 15px;">
                    ${billDisplay}
                </div>
            `;
            customerBookingsList.appendChild(card);
        });
    }
    
    renderCustomerBookings();

    window.payCustomerBill = function(bookingId, totalAmount) {
        let allBookings = JSON.parse(localStorage.getItem('azoom_bookings'));
        
        const index = allBookings.findIndex(b => b.bookingId === bookingId);
        
        if (index !== -1) {
            allBookings[index].finalTotal = totalAmount;
            allBookings[index].status = 'Completed';
            localStorage.setItem('azoom_bookings', JSON.stringify(allBookings));

            renderCustomerBookings(); 
        }
    };
}

// ==========================================
// CREDIT CARD EXPIRY AUTO-FORMATTING
// ==========================================
const cardExpiryInput = document.getElementById('cardExpiry');

if (cardExpiryInput) {
    cardExpiryInput.addEventListener('input', function (e) {
        let value = this.value.replace(/\D/g, '');
        
        //Limit to 4 digits max
        value = value.substring(0, 4);

        if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }

        this.value = value;
    });
}