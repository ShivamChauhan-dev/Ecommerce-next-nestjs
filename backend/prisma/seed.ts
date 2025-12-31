import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create or update admin user
    const adminPassword = await bcrypt.hash('admin123', 10);

    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@anvogue.com' },
        update: {
            role: 'ADMIN',
            password: adminPassword,
        },
        create: {
            email: 'admin@anvogue.com',
            password: adminPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN',
        },
    });

    console.log('✅ Admin user created/updated:', adminUser.email);

    // Create some sample categories
    const categories = [
        { name: 'Fashion', slug: 'fashion', image: 'https://placehold.co/400x400?text=Fashion' },
        { name: 'Electronics', slug: 'electronics', image: 'https://placehold.co/400x400?text=Electronics' },
        { name: 'Accessories', slug: 'accessories', image: 'https://placehold.co/400x400?text=Accessories' },
        { name: 'Footwear', slug: 'footwear', image: 'https://placehold.co/400x400?text=Footwear' },
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: cat,
            create: cat,
        });
    }
    console.log('✅ Categories seeded');

    // Create some sample brands
    const brands = [
        { name: 'Anvogue', slug: 'anvogue', image: 'https://placehold.co/200x100?text=Anvogue' },
        { name: 'Nike', slug: 'nike', image: 'https://placehold.co/200x100?text=Nike' },
        { name: 'Adidas', slug: 'adidas', image: 'https://placehold.co/200x100?text=Adidas' },
    ];

    for (const brand of brands) {
        await prisma.brand.upsert({
            where: { slug: brand.slug },
            update: brand,
            create: brand,
        });
    }
    console.log('✅ Brands seeded');

    // Get category and brand IDs for products
    const fashionCategory = await prisma.category.findUnique({ where: { slug: 'fashion' } });
    const anvogueBrand = await prisma.brand.findUnique({ where: { slug: 'anvogue' } });

    // Create sample products
    if (fashionCategory && anvogueBrand) {
        const products = [
            {
                name: 'Classic Cotton T-Shirt',
                slug: 'classic-cotton-tshirt',
                sku: 'TSH-001',
                price: 29.99,
                originPrice: 39.99,
                description: 'A comfortable cotton t-shirt for everyday wear.',
                stock: 100,
                images: ['https://placehold.co/600x600?text=T-Shirt'],
                sizes: ['S', 'M', 'L', 'XL'],
                categoryId: fashionCategory.id,
                brandId: anvogueBrand.id,
                isActive: true,
                isNew: true,
            },
            {
                name: 'Premium Denim Jeans',
                slug: 'premium-denim-jeans',
                sku: 'JNS-002',
                price: 59.99,
                originPrice: 79.99,
                description: 'High-quality denim jeans with perfect fit.',
                stock: 75,
                images: ['https://placehold.co/600x600?text=Jeans'],
                sizes: ['28', '30', '32', '34', '36'],
                categoryId: fashionCategory.id,
                brandId: anvogueBrand.id,
                isActive: true,
                isSale: true,
            },
            {
                name: 'Leather Crossbody Bag',
                slug: 'leather-crossbody-bag',
                sku: 'BAG-003',
                price: 89.99,
                originPrice: 119.99,
                description: 'Elegant leather crossbody bag for any occasion.',
                stock: 50,
                images: ['https://placehold.co/600x600?text=Bag'],
                sizes: [],
                categoryId: fashionCategory.id,
                brandId: anvogueBrand.id,
                isActive: true,
            },
        ];

        for (const product of products) {
            await prisma.product.upsert({
                where: { slug: product.slug },
                update: product,
                create: product,
            });
        }
        console.log('✅ Products seeded');
    }

    console.log('🎉 Database seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
