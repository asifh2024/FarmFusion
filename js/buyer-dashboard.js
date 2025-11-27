import { auth, db } from './firebase-config.js';
import { 
  onAuthStateChanged, 
  signOut 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentUser = null;
let allCrops = [];
let buyerData = null;


onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log('✅ User logged in:', user.uid);
    currentUser = user;
    await loadUserData();
    await loadAllCrops();
  } else {
    console.log('❌ No user, redirecting to login');
    window.location.href = 'login.html';
  }
});


async function loadUserData() {
  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
      buyerData = userDoc.data();
      const userName = buyerData.businessName || buyerData.contactPerson || 'Buyer';
      document.getElementById('userName').textContent = `Welcome, ${userName}`;
      console.log('✅ User data loaded:', userName);
    } else {
      console.log('⚠️ No user data found');
    }
  } catch (error) {
    console.error('❌ Error loading user data:', error);
  }
}


async function loadAllCrops() {
  try {
    console.log('🔄 Loading crops from Firestore...');
    const cropsRef = collection(db, 'crops');
    
    const q = query(cropsRef, where('status', '==', 'available'));
    const querySnapshot = await getDocs(q);
    
    allCrops = [];
    querySnapshot.forEach((doc) => {
      const cropData = doc.data();
      console.log('✅ Found crop:', cropData.cropName);
      allCrops.push({ id: doc.id, ...cropData });
    });

  
    allCrops.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    console.log('✅ Total crops loaded:', allCrops.length);

    displayRecommendedCrops();
    displayCrops(allCrops);
    updateCropCount(allCrops.length);
  } catch (error) {
    console.error('❌ Error loading crops:', error);
    const container = document.getElementById('cropsContainer');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-circle"></i>
          <p>Error loading crops. Please refresh the page or check console.</p>
        </div>
      `;
    }
  }
}


function displayRecommendedCrops() {
  const container = document.getElementById('recommendedCrops');
  if (!container) return;

  if (!buyerData || !buyerData.interestedCrops || allCrops.length === 0) {
    container.innerHTML = '<p style="color: #7f8c8d; padding: 2rem; text-align: center;">Browse all crops below.</p>';
    return;
  }

  const recommended = allCrops.filter(crop => {
    return buyerData.interestedCrops.some(interest => 
      crop.cropName.toLowerCase().includes(interest.toLowerCase()) ||
      interest.toLowerCase().includes(crop.cropName.toLowerCase())
    );
  }).slice(0, 4);

  if (recommended.length === 0) {
    container.innerHTML = '<p style="color: #7f8c8d;">No recommendations yet. Browse all crops below.</p>';
    return;
  }

  container.innerHTML = recommended.map(crop => createCropCard(crop, true)).join('');
  console.log('✅ Recommended crops displayed:', recommended.length);
}

// Display Crops
function displayCrops(crops) {
  const container = document.getElementById('cropsContainer');
  if (!container) {
    console.error('❌ cropsContainer not found');
    return;
  }
  
  if (crops.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <i class="fas fa-box-open" style="font-size: 4rem; color: #ddd; margin-bottom: 1rem;"></i>
        <p>No crops available at the moment. Check back later!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = crops.map(crop => createCropCard(crop, false)).join('');
  console.log('✅ Crops displayed:', crops.length);
}

// Create Crop Card
function createCropCard(crop, isRecommended) {
  return `
    <div class="crop-card" style="position: relative;">
      ${isRecommended ? '<div style="position: absolute; top: 10px; right: 10px; background: #f39c12; color: white; padding: 5px 10px; border-radius: 5px; font-size: 0.8rem; font-weight: bold; z-index: 10;"><i class="fas fa-star"></i> Recommended</div>' : ''}
      <img src="${crop.imageUrl || 'https://via.placeholder.com/300x200/90EE90/228B22?text=No+Image'}" alt="${crop.cropName}" class="crop-image" onerror="this.src='https://via.placeholder.com/300x200/90EE90/228B22?text=No+Image'">
      <div class="crop-details">
        <div class="crop-header">
          <h3 class="crop-name">${crop.cropName || 'Unnamed Crop'}</h3>
          <span class="crop-status status-available">${crop.status || 'available'}</span>
        </div>
        <div class="crop-info">
          <div class="info-row">
            <span class="info-label">Category:</span>
            <span class="info-value">${crop.category || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Quantity:</span>
            <span class="info-value">${crop.quantity || 0} kg</span>
          </div>
          <div class="info-row">
            <span class="info-label">Quality:</span>
            <span class="info-value">${crop.quality || 'Standard'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Harvest:</span>
            <span class="info-value">${crop.harvestDate ? new Date(crop.harvestDate).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
        <div class="price-tag">₹${crop.price || 0}/kg</div>
        ${crop.description ? `<p style="color: #7f8c8d; font-size: 0.9rem; margin: 1rem 0; line-height: 1.4;">${crop.description}</p>` : ''}
        <button class="btn btn-primary btn-full" onclick="showContactModal('${crop.id}')" style="margin-top: 1rem;">
          <i class="fas fa-phone"></i> Contact Farmer
        </button>
      </div>
    </div>
  `;
}


window.showContactModal = function(cropId) {
  const crop = allCrops.find(c => c.id === cropId);
  if (!crop) {
    alert('Crop not found');
    return;
  }

  const modal = document.getElementById('contactModal');
  const farmerDetails = document.getElementById('farmerDetails');
  
  if (!modal || !farmerDetails) return;

  farmerDetails.innerHTML = `
    <div class="detail-item">
      <i class="fas fa-seedling" style="font-size: 2rem; color: var(--primary-color);"></i>
      <div class="detail-info">
        <h4>${crop.cropName}</h4>
        <p style="font-size: 1.1rem;">${crop.quantity} kg @ ₹${crop.price}/kg</p>
      </div>
    </div>
    <div class="detail-item">
      <i class="fas fa-award" style="font-size: 1.5rem; color: var(--primary-color);"></i>
      <div class="detail-info">
        <h4>Quality & Category</h4>
        <p>${crop.quality} - ${crop.category}</p>
      </div>
    </div>
    <div class="detail-item">
      <i class="fas fa-calendar" style="font-size: 1.5rem; color: var(--primary-color);"></i>
      <div class="detail-info">
        <h4>Harvest Date</h4>
        <p>${crop.harvestDate ? new Date(crop.harvestDate).toLocaleDateString() : 'N/A'}</p>
      </div>
    </div>
    <div style="text-align: center; margin-top: 2rem; padding: 1rem; background: var(--bg-light); border-radius: var(--radius-sm);">
      <p style="font-size: 1.1rem; margin-bottom: 1rem;"><strong>📞 Contact Coming Soon!</strong></p>
      <p style="color: var(--text-light);">Direct messaging and phone contact features will be added soon.</p>
      <button class="btn btn-secondary" onclick="document.getElementById('contactModal').style.display='none'" style="margin-top: 1rem;">
        <i class="fas fa-times"></i> Close
      </button>
    </div>
  `;

  modal.style.display = 'block';
};

// Modal Controls
document.addEventListener('DOMContentLoaded', () => {
  // Close modal
  const closeModal = document.querySelector('.close-modal');
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      document.getElementById('contactModal').style.display = 'none';
    });
  }

  // Search & Filters
  const searchInput = document.getElementById('searchInput');
  const filterCategory = document.getElementById('filterCategory');
  const filterQuality = document.getElementById('filterQuality');
  const sortBy = document.getElementById('sortBy');

  if (searchInput) searchInput.addEventListener('input', filterCrops);
  if (filterCategory) filterCategory.addEventListener('change', filterCrops);
  if (filterQuality) filterQuality.addEventListener('change', filterCrops);
  if (sortBy) sortBy.addEventListener('change', filterCrops);
});

// Filter & Search
function filterCrops() {
  const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const category = document.getElementById('filterCategory')?.value || '';
  const quality = document.getElementById('filterQuality')?.value || '';
  const sortBy = document.getElementById('sortBy')?.value || 'newest';

  let filtered = allCrops.filter(crop => {
    const matchSearch = crop.cropName?.toLowerCase().includes(searchTerm) ||
                       crop.category?.toLowerCase().includes(searchTerm);
    const matchCategory = !category || crop.category === category;
    const matchQuality = !quality || crop.quality === quality;
    return matchSearch && matchCategory && matchQuality;
  });

  // Sort
  switch(sortBy) {
    case 'price-low':
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
      break;
    case 'price-high':
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
      break;
    case 'quantity':
      filtered.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
      break;
    default:
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  displayCrops(filtered);
  updateCropCount(filtered.length);
}

function updateCropCount(count) {
  const countEl = document.getElementById('cropCount');
  if (countEl) countEl.textContent = `${count} crops found`;
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  try {
    await signOut(auth);
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Logout error:', error);
  }
});
