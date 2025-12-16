const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:8000';

async function createUser(userData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, userData);
    console.log('✅ Test user created:', userData.email);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create test user:', error.message);
    throw error;
  }
}

async function createVirtualNumber(numberData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/admin/numbers`, numberData, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`,
      },
    });
    console.log('✅ Test number created:', numberData.phoneNumber);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create test number:', error.message);
    throw error;
  }
}

async function deleteUser(userId) {
  try {
    await axios.delete(`${API_BASE_URL}/api/admin/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`,
      },
    });
    console.log('✅ Test user deleted:', userId);
    return null;
  } catch (error) {
    console.error('❌ Failed to delete test user:', error.message);
    return null; // Don't throw on cleanup failure
  }
}

async function createUsageRecords(data) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/admin/usage-records`, data, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`,
      },
    });
    console.log('✅ Usage records created for number:', data.numberId);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create usage records:', error.message);
    throw error;
  }
}

async function createManyNumbers(numbers) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/admin/numbers/bulk`, {
      numbers,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`,
      },
    });
    console.log('✅ Bulk numbers created:', numbers.length);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create bulk numbers:', error.message);
    throw error;
  }
}

module.exports = {
  createUser,
  createVirtualNumber,
  deleteUser,
  createUsageRecords,
  createManyNumbers,
};