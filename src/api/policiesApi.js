import client from './client';

export const getPolicies = async (policyType) => {
  try {
    const response = await client.get(`/policies/${policyType}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${policyType} policy:`, error);
    throw error;
  }
};

export const getAllPolicies = async () => {
  try {
    const response = await client.get('/policies');
    return response.data;
  } catch (error) {
    console.error('Error fetching policies:', error);
    throw error;
  }
};

export const getTerms = () => getPolicies('terms');
export const getPrivacyPolicy = () => getPolicies('privacy');
export const getShippingPolicy = () => getPolicies('shipping');
export const getReturnPolicy = () => getPolicies('returns');
