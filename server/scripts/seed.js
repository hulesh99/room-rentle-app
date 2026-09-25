import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Room from '../models/Room.js';

const img = (seed) => ({ public_id: `seed/${seed}`, url: `https://picsum.photos/seed/${seed}/800/600` });

const ROOMS = [
  {
    title: 'Sunny single room near Kothrud metro station',
    city: 'Pune', state: 'Maharashtra', pincode: '411038',
    address: 'Lane 5, Kothrud Metro Residency, Pune',
    price: 9500, roomType: 'SINGLE', furnishing: 'SEMI_FURNISHED', preferredTenant: 'MALE',
    amenities: ['WIFI', 'AC', 'POWER_BACKUP'],
  },
  {
    title: 'Spacious double room in Koramangala with balcony',
    city: 'Bengaluru', state: 'Karnataka', pincode: '560034',
    address: '80 Feet Road, 4th Block Koramangala, Bengaluru',
    price: 16000, roomType: 'DOUBLE', furnishing: 'FURNISHED', preferredTenant: 'ANY',
    amenities: ['WIFI', 'AC', 'WASHING_MACHINE', 'BALCONY', 'LIFT'],
  },
  {
    title: 'Cozy PG-style studio for students near Andheri West',
    city: 'Mumbai', state: 'Maharashtra', pincode: '400058',
    address: 'Veera Desai Road, Andheri West, Mumbai',
    price: 13500, roomType: 'PG', furnishing: 'FURNISHED', preferredTenant: 'FEMALE',
    amenities: ['WIFI', 'AC', 'HOUSEKEEPING', 'SECURITY', 'TV'],
  },
  {
    title: 'Bright 1RK flat walking distance from Hauz Khas',
    city: 'Delhi', state: 'Delhi', pincode: '110016',
    address: 'Aurobindo Marg, Hauz Khas, New Delhi',
    price: 18000, roomType: 'FLAT', furnishing: 'SEMI_FURNISHED', preferredTenant: 'ANY',
    amenities: ['WIFI', 'REFRIGERATOR', 'GEYSER', 'LIFT'],
  },
  {
    title: 'Peaceful single room in Gachibowli IT corridor',
    city: 'Hyderabad', state: 'Telangana', pincode: '500032',
    address: 'Survey of India Colony, Gachibowli, Hyderabad',
    price: 8500, roomType: 'SINGLE', furnishing: 'UNFURNISHED', preferredTenant: 'MALE',
    amenities: ['WIFI', 'PARKING', 'POWER_BACKUP'],
  },
  {
    title: 'Modern furnished studio beside Anna Nagar tower park',
    city: 'Chennai', state: 'Tamil Nadu', pincode: '600040',
    address: '2nd Avenue, Anna Nagar West, Chennai',
    price: 12500, roomType: 'STUDIO', furnishing: 'FURNISHED', preferredTenant: 'FAMILY',
    amenities: ['AC', 'TV', 'WASHING_MACHINE', 'SECURITY'],
  },
  {
    title: 'Airy semi-furnished room overlooking Salt Lake lake',
    city: 'Kolkata', state: 'West Bengal', pincode: '700091',
    address: 'Sector 2, Salt Lake City, Kolkata',
    price: 7800, roomType: 'SINGLE', furnishing: 'SEMI_FURNISHED', preferredTenant: 'ANY',
    amenities: ['WIFI', 'GEYSER', 'BALCONY'],
  },
  {
    title: 'Renovated double room steps from Law Garden night market',
    city: 'Ahmedabad', state: 'Gujarat', pincode: '380006',
    address: 'Off Netaji Road, Ellisbridge, Ahmedabad',
    price: 9000, roomType: 'DOUBLE', furnishing: 'SEMI_FURNISHED', preferredTenant: 'ANY',
    amenities: ['WIFI', 'AC', 'PARKING', 'HOUSEKEEPING'],
  },
];

const seed = async () => {
  await connectDB();

  const existing = await Room.countDocuments();
  if (existing > 0 && !process.argv.includes('--force')) {
    console.log(`Database already has ${existing} rooms. Skipping seed (use --force to add anyway).`);
    await mongoose.connection.close();
    return;
  }

  const owners = await User.insertMany([
    { name: 'Demo Owner One', email: 'owner1@demo.com', password: 'Password@123', role: 'OWNER', city: 'Pune' },
    { name: 'Demo Owner Two', email: 'owner2@demo.com', password: 'Password@123', role: 'OWNER', city: 'Bengaluru' },
  ]);

  const bcrypt = (await import('bcryptjs')).default;
  const hashed = await bcrypt.hash('Password@123', 10);
  await User.updateMany(
    { email: { $in: ['owner1@demo.com', 'owner2@demo.com'] } },
    { $set: { password: hashed } }
  );

  const rooms = ROOMS.map((room, index) => ({
    ...room,
    description:
      `${room.title}. Well-ventilated space in a quiet neighbourhood with reliable water and power backup. ` +
      `Walking distance to markets and public transport. Owners live nearby and respond quickly on chat. ` +
      `Deposit equal to one month rent. Schedule a visit through a booking request.`,
    owner: owners[index % owners.length]._id,
    images: [img(`room${index + 1}a`), img(`room${index + 1}b`), img(`room${index + 1}c`)],
  }));

  const created = await Room.insertMany(rooms);
  console.log(`Seeded ${owners.length} demo owners and ${created.length} rooms.`);
  console.log('Owner logins: owner1@demo.com / owner2@demo.com | Password@123');
  await mongoose.connection.close();
};

seed().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
