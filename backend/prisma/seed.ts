import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    // Paths to JSON files (Adjust relative paths as needed)
    const productDataPath = path.join(__dirname, '../../anvogue/src/data/Product.json');
    const blogDataPath = path.join(__dirname, '../../anvogue/src/data/Blog.json');
    const testimonialDataPath = path.join(__dirname, '../../anvogue/src/data/Testimonial.json');

    const products = JSON.parse(fs.readFileSync(productDataPath, 'utf8'));
    const blogs = JSON.parse(fs.readFileSync(blogDataPath, 'utf8'));
    const testimonials = JSON.parse(fs.readFileSync(testimonialDataPath, 'utf8'));

    console.log('Seeding dummy clothing data...');

    // Dummy Clothing Category
    let clothesCat = await prisma.category.findFirst({ where: { slug: 'clothing-dummy' } });
    if (!clothesCat) {
        clothesCat = await prisma.category.create({ data: { name: 'Clothing', slug: 'clothing-dummy' } });
    }

    // Dummy Clothing Brand
    let clothesBrand = await prisma.brand.findFirst({ where: { slug: 'zara-dummy' } });
    if (!clothesBrand) {
        clothesBrand = await prisma.brand.create({ data: { name: 'Zara', slug: 'zara-dummy' } });
    }

    // Dummy Clothing Product
    const dummyProduct = await prisma.product.create({
        data: {
            name: "Classic White T-Shirt (Dummy)",
            slug: "classic-white-t-shirt-dummy",
            price: 29.99,
            originPrice: 49.99,
            rating: 4.5,
            sold: 100,
            quantity: 50,
            description: "A classic white t-shirt for everyday wear.",
            type: "Top",
            gender: "Unisex",
            isNew: true,
            isSale: false,
            images: ["/images/product/1.png"],
            sizes: ["S", "M", "L", "XL"],
            brandId: clothesBrand.id,
            categoryId: clothesCat.id
            // No nested variations create here
        }
    });

    // Create Dummy Variations separately
    await prisma.productVariation.createMany({
        data: [
            { productId: dummyProduct.id, color: "White", colorCode: "#FFFFFF", image: "/images/product/1.png" },
            { productId: dummyProduct.id, color: "Black", colorCode: "#000000", image: "/images/product/2.png" }
        ]
    });

    console.log(`Seeding ${products.length} products from JSON...`);
    for (const p of products) {
        // Handle Category
        let categoryId: string | null = null;
        if (p.category) {
            const catSlug = p.category.toLowerCase().replace(/ /g, '-');
            let cat = await prisma.category.findFirst({ where: { slug: catSlug } });
            if (!cat) {
                cat = await prisma.category.create({ data: { name: p.category, slug: catSlug } });
            }
            categoryId = cat.id;
        }

        // Handle Brand
        let brandId: string | null = null;
        if (p.brand) {
            const brandSlug = p.brand.toLowerCase().replace(/ /g, '-');
            let brand = await prisma.brand.findFirst({ where: { slug: brandSlug } });
            if (!brand) {
                brand = await prisma.brand.create({ data: { name: p.brand, slug: brandSlug } });
            }
            brandId = brand.id;
        }

        // Create Product
        // Check if product exists first to avoid unique constraint error on slug if re-seeding
        const existingProduct = await prisma.product.findUnique({ where: { slug: p.slug } });
        if (!existingProduct) {
            const newProduct = await prisma.product.create({
                data: {
                    name: p.name,
                    slug: p.slug,
                    price: parseFloat(p.price),
                    originPrice: parseFloat(p.originPrice),
                    rating: p.rate ? parseFloat(p.rate) : 0,
                    sold: p.sold || 0,
                    quantity: p.quantity || 0,
                    description: p.description,
                    type: p.type,
                    gender: p.gender,
                    isNew: p.new,
                    isSale: p.sale,
                    images: p.images,
                    sizes: p.sizes,
                    brandId: brandId,
                    categoryId: categoryId
                }
            });

            // Create Variations separately
            if (p.variation && p.variation.length > 0) {
                const variationsData = p.variation.map((v: any) => ({
                    productId: newProduct.id,
                    color: v.color,
                    colorCode: v.colorCode,
                    colorImage: v.colorImage,
                    image: v.image
                }));
                await prisma.productVariation.createMany({ data: variationsData });
            }
        }
    }

    console.log(`Seeding ${blogs.length} blogs...`);
    for (const b of blogs) {
        const existingBlog = await prisma.blog.findUnique({ where: { slug: b.slug } });
        if (!existingBlog) {
            await prisma.blog.create({
                data: {
                    title: b.title,
                    slug: b.slug,
                    content: b.description,
                    author: b.author,
                    category: b.category,
                    tags: [b.tag],
                    thumbImg: b.thumbImg,
                    coverImg: b.coverImg,
                    shortDesc: b.shortDesc,
                }
            });
        }
    }

    console.log(`Seeding ${testimonials.length} testimonials...`);
    // Testimonials don't have unique slug, just create (or clear DB first if needed)
    // For now simple create
    await prisma.testimonial.createMany({
        data: testimonials.map((t: any) => ({
            name: t.name,
            role: t.title,
            content: t.description,
            rating: t.star,
            images: t.images || [],
            avatar: t.avatar,
            date: t.date,
            address: t.address
        }))
    });

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
