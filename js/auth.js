import { auth, db } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
  setDoc,
  doc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Basic UI helpers – error and success message display
function showError(message) {
  const el = document.getElementById('errorMessage');
  if (!el) return;
  el.style.display = message ? 'block' : 'none';
  el.textContent = message;
}

function showSuccess(message) {
  const el = document.getElementById('successMessage');
  if (!el) return;
  el.style.display = message ? 'block' : 'none';
  el.textContent = message;
}

/* ============= FARMER REGISTRATION ============= */
const farmerRegisterForm = document.getElementById('farmerRegisterForm');
if (farmerRegisterForm) {
  farmerRegisterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');
    showSuccess('');

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const state = document.getElementById('state').value;
    const district = document.getElementById('district').value.trim();
    const farmSize = parseFloat(document.getElementById('farmSize').value);
    const crops = document.getElementById('crops').value;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        userType: 'farmer',
        fullName,
        email,
        phone,
        state,
        district,
        farmSize,
        crops: crops.split(',').map(c => c.trim()),
        createdAt: new Date().toISOString()
      });

      showSuccess('Farmer registration successful. Redirecting...');
      setTimeout(() => window.location.href = 'farmer-dashboard.html', 1500);
    } catch (error) {
      showError(error.message);
    }
  });
}

/* ============= BUYER REGISTRATION (OPTIONAL) ============= */
const buyerRegisterForm = document.getElementById('buyerRegisterForm');
if (buyerRegisterForm) {
  buyerRegisterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');
    showSuccess('');

    const businessName = document.getElementById('businessName').value.trim();
    const contactPerson = document.getElementById('contactPerson').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const businessType = document.getElementById('businessType').value;
    const state = document.getElementById('state').value;
    const city = document.getElementById('city').value.trim();
    const interestedCrops = document.getElementById('interestedCrops').value;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        userType: 'buyer',
        businessName,
        contactPerson,
        email,
        phone,
        businessType,
        state,
        city,
        interestedCrops: interestedCrops.split(',').map(c => c.trim()),
        createdAt: new Date().toISOString()
      });

      showSuccess('Buyer registration successful. Redirecting...');
      setTimeout(() => window.location.href = 'buyer-dashboard.html', 1500);
    } catch (error) {
      showError(error.message);
    }
  });
}

/* ============= LOGIN (COMMON) ============= */
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');
    showSuccess('');

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const userType = document.getElementById('userType').value; // 'farmer' or 'buyer'

    if (!userType) {
      showError('Please select user type.');
      return;
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      if (userType === 'farmer') {
        window.location.href = 'farmer-dashboard.html';
      } else {
        window.location.href = 'buyer-dashboard.html';
      }
    } catch (error) {
      showError(error.message);
    }
  });
}

/* ============= LOGOUT FUNCTION ============= */
function logout() {
  signOut(auth)
    .then(() => {
      console.log('User logged out successfully');
      window.location.href = 'index.html'; // or login.html
    })
    .catch((error) => {
      console.error('Logout error:', error);
      alert('Logout failed: ' + error.message);
    });
}

// Handle logout button click
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

// Also handle links/buttons with class 'logout-link'
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('logout-link')) {
    logout();
  }
});
 // Password visibility toggle
window.togglePassword = function(button) {
  const inputGroup = button.closest('.password-input-group');
  const input = inputGroup.querySelector('input');
  const icon = button.querySelector('i');
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
    button.classList.add('show');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
    button.classList.remove('show');
  }
};
