export const INDIAN_CITIES = [
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Nagpur', state: 'Maharashtra' },
  { city: 'Nashik', state: 'Maharashtra' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'New Delhi', state: 'Delhi' },
  { city: 'Gurugram', state: 'Haryana' },
  { city: 'Noida', state: 'Uttar Pradesh' },
  { city: 'Ghaziabad', state: 'Uttar Pradesh' },
  { city: 'Bengaluru', state: 'Karnataka' },
  { city: 'Mysuru', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Coimbatore', state: 'Tamil Nadu' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Surat', state: 'Gujarat' },
  { city: 'Vadodara', state: 'Gujarat' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Udaipur', state: 'Rajasthan' },
  { city: 'Lucknow', state: 'Uttar Pradesh' },
  { city: 'Kanpur', state: 'Uttar Pradesh' },
  { city: 'Indore', state: 'Madhya Pradesh' },
  { city: 'Bhopal', state: 'Madhya Pradesh' },
  { city: 'Chandigarh', state: 'Chandigarh' },
  { city: 'Dehradun', state: 'Uttarakhand' },
  { city: 'Kochi', state: 'Kerala' },
  { city: 'Thiruvananthapuram', state: 'Kerala' },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { city: 'Vijayawada', state: 'Andhra Pradesh' },
  { city: 'Patna', state: 'Bihar' },
  { city: 'Guwahati', state: 'Assam' },
  { city: 'Bhubaneswar', state: 'Odisha' },
  { city: 'Raipur', state: 'Chhattisgarh' },
  { city: 'Panaji', state: 'Goa' },
  { city: 'Shimla', state: 'Himachal Pradesh' },
];

export const POPULAR_CITIES = ['Mumbai', 'Pune', 'Bengaluru', 'Delhi', 'Hyderabad', 'Chennai'];

export const searchCities = (query = '', limit = 6) => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return INDIAN_CITIES.filter(
    ({ city }) =>
      city.toLowerCase().startsWith(q) || city.toLowerCase().includes(q)
  ).slice(0, limit);
};
