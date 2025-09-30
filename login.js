window.onload = function () {
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
            client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
            callback: handleCredentialResponse
        });

        const signinBtn = document.getElementById("g_id_signin");
        const signupBtn = document.getElementById("g_id_signup");

        if (signinBtn) google.accounts.id.renderButton(signinBtn, { theme: "outline", size: "large" });
        if (signupBtn) google.accounts.id.renderButton(signupBtn, { theme: "outline", size: "large" });
    }

    updateSigninButtonState();
    updateSignupButtonState();
};

// ----- DOM Elements -----
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

// Signup form elements
const signupForm = document.getElementById('signupForm');
const signupPasswordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const mismatchMessage = document.getElementById('mismatch-message');
const matchMessage = document.getElementById('match-message');
const passwordStrengthError = document.getElementById('password-strength-error');
const signupTermsCheckbox = document.getElementById('signupTermsCheckbox');
const signupSubmitButton = document.getElementById('signupButton');

// Signin form elements
const signinForm = document.getElementById('signinForm');
const signinTermsCheckbox = document.getElementById('signinTermsCheckbox');
const signinSubmitButton = document.getElementById('signinButton');

// Modal elements
const signupTermsLink = document.getElementById('signupTermsLink');
const signupPrivacyLink = document.getElementById('signupPrivacyLink');
const signinTermsLink = document.getElementById('signinTermsLink');
const signinPrivacyLink = document.getElementById('signinPrivacyLink');
const termsModal = document.getElementById('termsModal');
const privacyModal = document.getElementById('privacyModal');
const closeTerms = document.getElementById('closeTerms');
const closePrivacy = document.getElementById('closePrivacy');

// Constants
const ADMIN_REDIRECT = 'admin_dashboard.html';
const USER_REDIRECT = 'index.html';

// ----- UI Panel Toggle -----
signUpButton.addEventListener('click', () => {
    container.classList.add('right-panel-active');
    resetFormMessages();
});

signInButton.addEventListener('click', () => {
    container.classList.remove('right-panel-active');
    resetFormMessages();
});

function resetFormMessages() {
    const messages = [mismatchMessage, matchMessage, passwordStrengthError];
    messages.forEach(el => {
        if (el) el.style.display = 'none';
    });

    document.querySelectorAll('.error-message').forEach(el => {
        if (el) el.style.display = 'none';
    });
}

// ----- Password Validation -----
function validatePasswordStrength(password) {
    if (!password) return true;
    const isValid = password.length >= 8 &&
        /\d/.test(password) &&
        /[A-Z]/.test(password) &&
        /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (passwordStrengthError) {
        passwordStrengthError.style.display = isValid ? 'none' : 'inline-block';
    }
    return isValid;
}

function validatePasswordMatch() {
    if (!signupPasswordInput || !confirmPasswordInput) return true;

    const isMatch = signupPasswordInput.value === confirmPasswordInput.value;

    if (mismatchMessage) {
        mismatchMessage.style.display = isMatch ? 'none' : 'inline-block';
    }
    if (matchMessage) {
        matchMessage.style.display = isMatch ? 'inline-block' : 'none';
    }
    return isMatch;
}

function validateFormInputs(form) {
    if (!form) return false;

    let isValid = true;
    form.querySelectorAll('input[required]').forEach(input => {
        const errorElement = document.getElementById(`${input.id}-error`);
        if (errorElement) {
            if (!input.value.trim()) {
                errorElement.style.display = 'inline-block';
                isValid = false;
            } else {
                errorElement.style.display = 'none';
            }
        }
    });
    return isValid;
}

// ----- Email Validation -----
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ----- Update Button States -----
function updateSigninButtonState() {
    if (signinSubmitButton && signinTermsCheckbox) {
        signinSubmitButton.disabled = !signinTermsCheckbox.checked;
    }
}

function updateSignupButtonState() {
    if (signupSubmitButton && signupTermsCheckbox) {
        signupSubmitButton.disabled = !signupTermsCheckbox.checked;
    }
}

// ----- SIGNUP -----
if (signupForm) {
    signupForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('email')?.value.trim().toLowerCase();
        const password = signupPasswordInput?.value;

        if (!validateFormInputs(signupForm) ||
            !validatePasswordStrength(password) ||
            !validatePasswordMatch() ||
            !validateEmail(email) ||
            !signupTermsCheckbox.checked) {
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: document.getElementById('username').value,
                    email: email,
                    password: password
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('Account created successfully! Welcome to Lost & Found Hub.');
                container.classList.remove('right-panel-active');
            } else {
                alert('Sign Up failed: ' + result.message);
            }
        } catch (err) {
            console.error('Signup Error:', err);
            alert('Something went wrong during signup. Please try again.');
        }
    });
}

// ----- SIGNIN -----
if (signinForm) {
    signinForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!validateFormInputs(signinForm)) return;

        const email = document.getElementById('signinEmail').value.trim().toLowerCase();
        const password = document.getElementById('signinPassword').value;

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            let result;
            try {
                result = await response.json();
            } catch {
                throw new Error('Server returned invalid JSON. Check backend API.');
            }

            if (result.success) {
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('userName', result.user?.username || result.user?.name || 'Unknown');
                localStorage.setItem('userEmail', result.user?.email || '');
                localStorage.setItem('userPhoto', result.user?.photo || result.user?.picture || '');

                // ✅ Redirect based on role
                if (result.role === "admin") {
                    window.location.href = ADMIN_REDIRECT;
                } else {
                    window.location.href = USER_REDIRECT;
                }
            } else {
                const errorElement = document.getElementById('signinPassword-error');
                if (errorElement) {
                    errorElement.textContent = result.message || 'Invalid email or password';
                    errorElement.style.display = 'inline-block';
                }
            }
        } catch (err) {
            console.error('Signin Error:', err);
            alert('Sign in error: ' + err.message);
        }
    });
}

// ----- PASSWORD INPUT EVENTS -----
if (signupPasswordInput && confirmPasswordInput) {
    signupPasswordInput.addEventListener('input', () => {
        validatePasswordStrength(signupPasswordInput.value);
        validatePasswordMatch();
    });
    confirmPasswordInput.addEventListener('input', validatePasswordMatch);
}

// ----- TERMS CHECKBOX EVENTS -----
if (signinTermsCheckbox) {
    signinTermsCheckbox.addEventListener('change', updateSigninButtonState);
}
if (signupTermsCheckbox) {
    signupTermsCheckbox.addEventListener('change', updateSignupButtonState);
}

// ----- MODAL CONTROLS -----
if (signupTermsLink) {
    signupTermsLink.addEventListener('click', function (e) {
        e.preventDefault();
        if (termsModal) termsModal.style.display = 'flex';
    });
}

if (signupPrivacyLink) {
    signupPrivacyLink.addEventListener('click', function (e) {
        e.preventDefault();
        if (privacyModal) privacyModal.style.display = 'flex';
    });
}

if (signinTermsLink) {
    signinTermsLink.addEventListener('click', function (e) {
        e.preventDefault();
        if (termsModal) termsModal.style.display = 'flex';
    });
}

if (signinPrivacyLink) {
    signinPrivacyLink.addEventListener('click', function (e) {
        e.preventDefault();
        if (privacyModal) privacyModal.style.display = 'flex';
    });
}

if (closeTerms) {
    closeTerms.addEventListener('click', function () {
        if (termsModal) termsModal.style.display = 'none';
    });
}
if (closePrivacy) {
    closePrivacy.addEventListener('click', function () {
        if (privacyModal) privacyModal.style.display = 'none';
    });
}

window.addEventListener('click', function (e) {
    if (e.target === termsModal) {
        termsModal.style.display = 'none';
    }
    if (e.target === privacyModal) {
        privacyModal.style.display = 'none';
    }
});

// ----- GOOGLE LOGIN -----
function handleCredentialResponse(response) {
    fetch('http://localhost:3000/api/google-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: response.credential })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userName', data.user.username || data.user.name);
                localStorage.setItem('userEmail', data.user.email);
                localStorage.setItem('userPhoto', data.user.photo || data.user.picture || '');
                alert('Welcome to Lost & Found Hub!');
                window.location.href = USER_REDIRECT;
            } else {
                alert('Google Sign-In failed: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Google auth error:', error);
            alert('Error during Google sign-in. Please try again.');
        });
}
