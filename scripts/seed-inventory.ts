/**
 * Seed Inventory Data
 * Run with: npx tsx scripts/seed-inventory.ts
 */

import { db } from '../server/db.js';
import { inventory } from '../shared/schema.js';

const inventoryData = [
  // ============ APPAREL ============
  // Women's Shirts
  { name: "Women's SS Shirt", category: 'apparel', color: 'White', size: 'X-Small', quantity: 2, location: '1st Storage Closet' },
  { name: "Women's SS Shirt", category: 'apparel', color: 'White', size: 'Small', quantity: 1, location: '1st Storage Closet' },
  { name: "Women's SS Shirt", category: 'apparel', color: 'Black', size: 'Small', quantity: 4, location: '1st Storage Closet' },
  { name: "Women's LS Shirt", category: 'apparel', color: 'Black', size: 'Small', quantity: 4, location: '1st Storage Closet' },
  { name: "Women's LS Shirt", category: 'apparel', color: 'Black', size: 'Medium', quantity: 3, location: '1st Storage Closet' },

  // Roof-ER Long Sleeve - Grey
  { name: 'Roof-ER Shirt LS', category: 'apparel', color: 'Grey', size: 'Medium', quantity: 19, location: '1st Storage Closet' },
  { name: 'Roof-ER Shirt LS', category: 'apparel', color: 'Grey', size: 'Large', quantity: 29, location: '1st Storage Closet' },
  { name: 'Roof-ER Shirt LS', category: 'apparel', color: 'Grey', size: 'X-Large', quantity: 22, location: '1st Storage Closet' },
  { name: 'Roof-ER Shirt LS', category: 'apparel', color: 'Grey', size: 'XX-Large', quantity: 2, location: '1st Storage Closet' },

  // Roof-ER Long Sleeve - Black
  { name: 'Roof-ER Shirt LS', category: 'apparel', color: 'Black', size: 'Medium', quantity: 19, location: '1st Storage Closet' },
  { name: 'Roof-ER Shirt LS', category: 'apparel', color: 'Black', size: 'Large', quantity: 29, location: '1st Storage Closet' },
  { name: 'Roof-ER Shirt LS', category: 'apparel', color: 'Black', size: 'X-Large', quantity: 19, location: '1st Storage Closet' },
  { name: 'Roof-ER Shirt LS', category: 'apparel', color: 'Black', size: 'XX-Large', quantity: 6, location: '1st Storage Closet' },

  // Roof-ER Long Sleeve - Red
  { name: 'Roof-ER Shirt LS', category: 'apparel', color: 'Red', size: 'Medium', quantity: 9, location: '1st Storage Closet' },
  { name: 'Roof-ER Shirt LS', category: 'apparel', color: 'Red', size: 'Large', quantity: 2, location: '1st Storage Closet' },
  { name: 'Roof-ER Shirt LS', category: 'apparel', color: 'Red', size: 'X-Large', quantity: 4, location: '1st Storage Closet' },

  // Roof-ER Short Sleeve - Grey
  { name: 'Roof-ER Shirt SS', category: 'apparel', color: 'Grey', size: 'Small', quantity: 10, location: '1st Storage Closet' },
  { name: 'Roof-ER Shirt SS', category: 'apparel', color: 'Grey', size: 'Medium', quantity: 9, location: '1st Storage Closet' },
  { name: 'Roof-ER Shirt SS', category: 'apparel', color: 'Grey', size: 'Large', quantity: 6, location: '1st Storage Closet' },
  { name: 'Roof-ER Shirt SS', category: 'apparel', color: 'Grey', size: 'X-Large', quantity: 25, location: '1st Storage Closet' },
  { name: 'Roof-ER Shirt SS', category: 'apparel', color: 'Grey', size: 'XX-Large', quantity: 9, location: '1st Storage Closet' },

  // Roof-ER Short Sleeve - Black
  { name: 'Roof-ER Shirt SS', category: 'apparel', color: 'Black', size: 'Small', quantity: 10, location: '1st Storage Closet' },
  { name: 'Roof-ER Shirt SS', category: 'apparel', color: 'Black', size: 'Medium', quantity: 1, location: '1st Storage Closet' },
  { name: 'Roof-ER Shirt SS', category: 'apparel', color: 'Black', size: 'Large', quantity: 0, location: '1st Storage Closet', reorderThreshold: 5 },
  { name: 'Roof-ER Shirt SS', category: 'apparel', color: 'Black', size: 'X-Large', quantity: 23, location: '1st Storage Closet' },
  { name: 'Roof-ER Shirt SS', category: 'apparel', color: 'Black', size: 'XXL', quantity: 10, location: '1st Storage Closet' },

  // Roof-ER Jackets
  { name: 'Roof-ER Jacket w/ Insert', category: 'apparel', color: 'Black', size: 'Small', quantity: 6, location: '1st Storage Closet' },
  { name: 'Roof-ER Jacket w/ Insert', category: 'apparel', color: 'Black', size: 'Medium', quantity: 5, location: '1st Storage Closet' },
  { name: 'Roof-ER Jacket w/ Insert', category: 'apparel', color: 'Black', size: 'Large', quantity: 6, location: '1st Storage Closet' },
  { name: 'Roof-ER Jacket w/ Insert', category: 'apparel', color: 'Black', size: 'X-Large', quantity: 4, location: '1st Storage Closet' },
  { name: 'Roof-ER Jacket w/ Insert', category: 'apparel', color: 'Black', size: 'XX-Large', quantity: 4, location: '1st Storage Closet' },
  { name: 'Roof-ER Jacket w/ Insert', category: 'apparel', color: 'Black', size: 'XXX-Large', quantity: 2, location: '1st Storage Closet' },
  { name: 'Roof-ER Jacket (no Insert/GAF Patch)', category: 'apparel', color: 'Black', size: 'Medium', quantity: 1, location: '1st Storage Closet' },

  // Accessories
  { name: 'Roof-ER CAPS', category: 'apparel', color: 'Black', size: 'One Size', quantity: 28, location: '1st Storage Closet' },
  { name: 'Roof-ER Beanies', category: 'apparel', color: 'Black', size: 'One Size', quantity: 13, location: '1st Storage Closet' },

  // GAF Shirts (For Production)
  { name: 'GAF LS Cotton Shirts', category: 'apparel', color: 'Grey', size: 'Small', quantity: 35, location: '1st Storage Closet', notes: 'For Production' },
  { name: 'GAF LS Cotton Shirts', category: 'apparel', color: 'Grey', size: 'Medium', quantity: 95, location: '1st Storage Closet', notes: 'For Production' },
  { name: 'GAF LS Cotton Shirts', category: 'apparel', color: 'Grey', size: 'Large', quantity: 189, location: '1st Storage Closet', notes: 'For Production' },
  { name: 'GAF LS Cotton Shirts', category: 'apparel', color: 'Grey', size: 'X-Large', quantity: 79, location: '1st Storage Closet', notes: 'For Production' },

  // ============ RETAIL TEAM ============
  { name: 'Lanyards', category: 'retail_team', color: 'Red', size: 'One Size', quantity: 42, location: '1st Storage Closet', notes: 'For Retail Team' },
  { name: 'Plastic Folders + Roof ER Sticker', category: 'retail_team', color: 'Black', size: '8.5 x 11', quantity: 33, location: '1st Storage Closet', notes: 'For Retail Team' },
  { name: 'Unboxed Telescope Ladder', category: 'retail_team', color: null, size: null, quantity: 1, location: '2nd Storage Closet', notes: 'For Retail Team' },
  { name: 'Boxed Telescope Ladder', category: 'retail_team', color: null, size: null, quantity: 2, location: '2nd Storage Closet', notes: 'For Retail Team' },

  // ============ INSURANCE TEAM ============
  { name: 'Roof-ER Yard Signs', category: 'insurance_team', color: 'Red & White', size: null, quantity: 49, location: '1st Storage Closet', notes: 'For Insurance Team' },
  { name: 'Roof-ER Yard Signs', category: 'insurance_team', color: 'Red & White', size: null, quantity: 43, location: 'Outside 1st Storage Closet', notes: 'For Insurance Team' },
  { name: 'USB C Fast Charging Cable 3FT (4 Pack)', category: 'insurance_team', color: null, size: null, quantity: 8, location: '2nd Black Cabinet', notes: '2 packages = 8 cables' },
  { name: 'USB A to USB A Cable 3ft (10-Pack)', category: 'insurance_team', color: null, size: null, quantity: 10, location: '2nd Black Cabinet', notes: '1 package = 10 cables' },
  { name: 'USB C Wall Charger 20W Dual Port', category: 'insurance_team', color: null, size: null, quantity: 8, location: '2nd Black Cabinet', notes: '2 packages + 2 loose = 8 chargers' },
  { name: 'Packaged Flashlights', category: 'insurance_team', color: null, size: null, quantity: 7, location: '2nd Black Cabinet' },
  { name: 'Used Flashlights (No chargers)', category: 'insurance_team', color: null, size: null, quantity: 5, location: '2nd Black Cabinet' },
  { name: 'Screen Protector (2 pack)', category: 'insurance_team', color: null, size: null, quantity: 29, location: '2nd Black Cabinet', notes: '14 packages + 1 open = 29 total' },
  { name: 'Keyboard Case', category: 'insurance_team', color: null, size: null, quantity: 3, location: '2nd Black Cabinet', notes: '7 more expected 1/20/26' },
  { name: 'Roll of Black Labels', category: 'insurance_team', color: null, size: null, quantity: 3, location: '2nd Black Cabinet', notes: '2 rolls + 1/2 roll' },
  { name: 'Silver Markers', category: 'insurance_team', color: null, size: null, quantity: 21, location: '2nd Black Cabinet', notes: '36 count pkg expected 1/20/26. Retail uses these too.' },
  { name: 'EXPO Markers', category: 'insurance_team', color: null, size: null, quantity: 10, location: '2nd Black Cabinet', notes: 'General for Insurance & Retail' },
  { name: 'Little Giant Ladders Velocity 17-Ft (Unboxed)', category: 'insurance_team', color: null, size: null, quantity: 4, location: '2nd Storage Closet' },
  { name: 'Little Giant Ladders Velocity 17-Ft (Boxed)', category: 'insurance_team', color: null, size: null, quantity: 7, location: '2nd Storage Closet' },
  { name: 'Werner Ladder', category: 'insurance_team', color: null, size: null, quantity: 1, location: '2nd Storage Closet' },

  // ============ OFFICE SUPPLIES ============
  { name: 'Boxes of Tissue', category: 'office_supplies', color: null, size: null, quantity: 6, location: 'Cabinet next to refrigerator' },
  { name: 'Water Filter Replacement', category: 'office_supplies', color: null, size: null, quantity: 1, location: 'Cabinet next to refrigerator', notes: 'For Office Refrigerator' },
  { name: 'Paper Towels', category: 'office_supplies', color: null, size: null, quantity: 32, location: 'Cabinet next to dishwasher', notes: 'Box of 4 packages, 8 count each expected 1/20/26' },
  { name: 'Coffee Pods (96 Count Box)', category: 'office_supplies', color: null, size: null, quantity: 2, location: 'Storage Closet w/ Shirts' },
  { name: 'Coffee Pods (42 Count Box)', category: 'office_supplies', color: null, size: null, quantity: 1, location: 'Storage Closet w/ Shirts' },
  { name: 'Espresso Coffee Pods (120 Count)', category: 'office_supplies', color: null, size: null, quantity: 1, location: 'Storage Closet w/ Shirts' },
  { name: 'Reams of Printer Paper 8.5x11', category: 'office_supplies', color: null, size: '8.5 x 11', quantity: 5, location: '1st & 3rd Black Cabinet', notes: '3.75 reams (Cabinet 1) + 1 ream (Cabinet 3)' },
  { name: 'Black Tip Sharpies', category: 'office_supplies', color: 'Black', size: null, quantity: 7, location: '3rd Black Cabinet' },
  { name: 'Yellow Highlighters', category: 'office_supplies', color: 'Yellow', size: null, quantity: 12, location: '3rd Black Cabinet' },
  { name: 'Box of Unopened Batteries', category: 'office_supplies', color: null, size: null, quantity: 1, location: '3rd Black Cabinet' },
  { name: 'Black Pens (pkg of 14)', category: 'office_supplies', color: 'Black', size: null, quantity: 2, location: '3rd Black Cabinet' },
  { name: 'Stapler', category: 'office_supplies', color: null, size: null, quantity: 1, location: '3rd Black Cabinet' },
  { name: 'Small Binder Clips (boxes)', category: 'office_supplies', color: null, size: null, quantity: 9, location: '3rd Black Cabinet' },
  { name: 'Roll of Packing Tape', category: 'office_supplies', color: null, size: null, quantity: 1, location: '3rd Black Cabinet' },
  { name: 'Black Toner Cartridge', category: 'office_supplies', color: null, size: null, quantity: 1, location: '3rd Black Cabinet' },
  { name: 'Full Set Toner Cartridge (Color + Black)', category: 'office_supplies', color: null, size: null, quantity: 1, location: '3rd Black Cabinet' },
  { name: 'Black Cable Ties (pkg)', category: 'office_supplies', color: 'Black', size: null, quantity: 1, location: '3rd Black Cabinet' },
  { name: 'Box of White Letter Sized Envelopes', category: 'office_supplies', color: 'White', size: null, quantity: 1, location: '3rd Black Cabinet' },
  { name: 'Pkg of 8.5x11 Mailing Envelopes', category: 'office_supplies', color: null, size: '8.5 x 11', quantity: 1, location: '3rd Black Cabinet' },
  { name: 'White 8.5x11 Lined Note Pads', category: 'office_supplies', color: 'White', size: '8.5 x 11', quantity: 9, location: '3rd Black Cabinet' },

  // ============ DAILY USE SUPPLIES ============
  { name: 'Paper Towels (Daily Use)', category: 'daily_use', color: null, size: null, quantity: 13, location: 'Cabinet above refrigerator', notes: 'Ongoing count for daily use' },
  { name: 'Coffee Pods (Regular)', category: 'daily_use', color: null, size: null, quantity: 90, location: 'Cabinet above Coffee Machines', notes: 'Daily use stock' },
  { name: 'Espresso Pods', category: 'daily_use', color: null, size: null, quantity: 120, location: 'Cabinet above Coffee Machines', notes: 'Daily use stock' },
  { name: 'Sugar Packets', category: 'daily_use', color: null, size: null, quantity: 100, location: 'Cabinet above Coffee Machines' },
  { name: 'Yellow Highlighters (Daily Use)', category: 'daily_use', color: 'Yellow', size: null, quantity: 10, location: '1st Black Cabinet' },
  { name: 'Black Pens (Daily Use)', category: 'daily_use', color: 'Black', size: null, quantity: 29, location: '1st Black Cabinet' },
  { name: 'Triple A Batteries', category: 'daily_use', color: null, size: null, quantity: 15, location: '1st Black Cabinet' },
  { name: 'Double A Batteries', category: 'daily_use', color: null, size: null, quantity: 6, location: '1st Black Cabinet', reorderThreshold: 10 },
  { name: 'Expo Markers (Daily Use)', category: 'daily_use', color: null, size: null, quantity: 6, location: '1st Black Cabinet' },
  { name: 'Erasers', category: 'daily_use', color: null, size: null, quantity: 2, location: '1st Black Cabinet' },
  { name: 'Stapler (Daily Use)', category: 'daily_use', color: null, size: null, quantity: 1, location: '1st Black Cabinet' },
  { name: 'Scissors', category: 'daily_use', color: null, size: null, quantity: 1, location: '1st Black Cabinet' },
  { name: 'Packing Tape (Daily Use)', category: 'daily_use', color: null, size: null, quantity: 1, location: '1st Black Cabinet' },
  { name: 'Rolls of Desk Tape', category: 'daily_use', color: null, size: null, quantity: 5, location: '1st Black Cabinet' },
  { name: 'Sticky Notes Pads', category: 'daily_use', color: null, size: null, quantity: 9, location: '1st Black Cabinet' },
  { name: 'Envelopes Box', category: 'daily_use', color: null, size: null, quantity: 1, location: '1st Black Cabinet' },
  { name: 'Paper Clips (Large Purple)', category: 'daily_use', color: 'Purple', size: null, quantity: 1, location: '1st Black Cabinet', notes: 'Package of larger clips' },
  { name: 'Paper Clips (Small)', category: 'daily_use', color: null, size: null, quantity: 1, location: 'Front Desk', notes: 'Smaller clips at front desk' },
  { name: 'Colored Chalk (boxes)', category: 'other', color: 'Colored', size: null, quantity: 16, location: 'Storage Closet' },
  { name: 'Yellow Chalk (box)', category: 'other', color: 'Yellow', size: null, quantity: 1, location: 'Storage Closet' },
] as const;

async function seedInventory() {
  console.log('Seeding inventory data...');

  try {
    // Clear existing inventory (optional - comment out if you want to append)
    // await db.delete(inventory);
    // console.log('Cleared existing inventory');

    // Insert all inventory items
    for (const item of inventoryData) {
      await db.insert(inventory).values({
        name: item.name,
        category: item.category as any,
        color: item.color || null,
        size: item.size || null,
        quantity: item.quantity,
        location: item.location || null,
        notes: item.notes || null,
        reorderThreshold: (item as any).reorderThreshold || null,
      });
    }

    console.log(`Successfully seeded ${inventoryData.length} inventory items!`);

    // Print summary by category
    const summary = inventoryData.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nSummary by category:');
    for (const [cat, count] of Object.entries(summary)) {
      console.log(`  ${cat}: ${count} items`);
    }

  } catch (error) {
    console.error('Error seeding inventory:', error);
    throw error;
  }

  process.exit(0);
}

seedInventory();
