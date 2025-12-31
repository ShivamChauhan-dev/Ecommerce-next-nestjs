const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
    const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/anvogue';
    // Remove query params like directConnection for clean connection if needed, though driver handles them
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db(uri.split('/').pop().split('?')[0]); // Extract db name

        // Paths to JSON files
        const productDataPath = path.join(__dirname, '../../anvogue/src/data/Product.json');
        const blogDataPath = path.join(__dirname, '../../anvogue/src/data/Blog.json');
        const testimonialDataPath = path.join(__dirname, '../../anvogue/src/data/Testimonial.json');

        const products = JSON.parse(fs.readFileSync(productDataPath, 'utf8'));
        const blogs = JSON.parse(fs.readFileSync(blogDataPath, 'utf8'));
        const testimonials = JSON.parse(fs.readFileSync(testimonialDataPath, 'utf8'));

        // --- DUMMY DATA ---
        console.log('Seeding dummy clothing data...');

        const categoriesCollection = db.collection('Category');
        const brandsCollection = db.collection('Brand');
        const productsCollection = db.collection('Product');
        const productVariationsCollection = db.collection('ProductVariation');
        const blogsCollection = db.collection('Blog');
        const testimonialsCollection = db.collection('Testimonial');

        // Dummy Category
        let clothesCat = await categoriesCollection.findOne({ slug: 'clothing-dummy' });
        if (!clothesCat) {
            const res = await categoriesCollection.insertOne({ name: 'Clothing', slug: 'clothing-dummy' });
            clothesCat = { _id: res.insertedId };
        }

        // Dummy Brand
        let clothesBrand = await brandsCollection.findOne({ slug: 'zara-dummy' });
        if (!clothesBrand) {
            const res = await brandsCollection.insertOne({ name: 'Zara', slug: 'zara-dummy' });
            clothesBrand = { _id: res.insertedId };
        }

        // Dummy Product
        const dummyProductSlug = "classic-white-t-shirt-dummy";
        let dummyProduct = await productsCollection.findOne({ slug: dummyProductSlug });

        if (!dummyProduct) {
            const res = await productsCollection.insertOne({
                name: "Classic White T-Shirt (Dummy)",
                slug: dummyProductSlug,
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
                brandId: clothesBrand._id,
                categoryId: clothesCat._id,
                wishlistIDs: [],
                compareListIDs: []
            });
            dummyProduct = { _id: res.insertedId };

            // Dummy Variations
            await productVariationsCollection.insertMany([
                { productId: dummyProduct._id, color: "White", colorCode: "#FFFFFF", image: "/images/product/1.png" },
                { productId: dummyProduct._id, color: "Black", colorCode: "#000000", image: "/images/product/2.png" }
            ]);
        }

        // --- JSON IMPORT ---
        console.log(`Seeding ${products.length} products from JSON...`);
        for (const p of products) {
            // Category
            let categoryId = null;
            if (p.category) {
                const catSlug = p.category.toLowerCase().replace(/ /g, '-');
                let cat = await categoriesCollection.findOne({ slug: catSlug });
                if (!cat) {
                    const res = await categoriesCollection.insertOne({ name: p.category, slug: catSlug });
                    cat = { _id: res.insertedId };
                }
                categoryId = cat._id;
            }

            // Brand
            let brandId = null;
            if (p.brand) {
                const brandSlug = p.brand.toLowerCase().replace(/ /g, '-');
                let brand = await brandsCollection.findOne({ slug: brandSlug });
                if (!brand) {
                    const res = await brandsCollection.insertOne({ name: p.brand, slug: brandSlug });
                    brand = { _id: res.insertedId };
                }
                brandId = brand._id;
            }

            // Product
            const existingProduct = await productsCollection.findOne({ slug: p.slug });
            if (!existingProduct) {
                const res = await productsCollection.insertOne({
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
                    isNew: p.new === true || p.new === 'true',
                    isSale: p.sale === true || p.sale === 'true',
                    images: p.images || [],
                    sizes: p.sizes || [],
                    brandId: brandId,
                    categoryId: categoryId,
                    wishlistIDs: [],
                    compareListIDs: []
                });
                const newProductId = res.insertedId;

                // Variations
                if (p.variation && p.variation.length > 0) {
                    const variations = p.variation.map(v => ({
                        productId: newProductId,
                        color: v.color,
                        colorCode: v.colorCode,
                        colorImage: v.colorImage,
                        image: v.image
                    }));
                    await productVariationsCollection.insertMany(variations);
                }
            }
        }

        console.log(`Seeding ${blogs.length} blogs...`);
        for (const b of blogs) {
            const existingBlog = await blogsCollection.findOne({ slug: b.slug });
            if (!existingBlog) {
                await blogsCollection.insertOne({
                    title: b.title,
                    slug: b.slug,
                    content: b.description,
                    author: b.author,
                    category: b.category,
                    tags: [b.tag],
                    thumbImg: b.thumbImg,
                    coverImg: b.coverImg,
                    shortDesc: b.shortDesc,
                    createdAt: new Date()
                });
            }
        }

        console.log(`Seeding ${testimonials.length} testimonials...`);
        // Batch insert testimonials
        const testimonialDocs = testimonials.map(t => ({
            name: t.name,
            role: t.title,
            content: t.description,
            rating: t.star,
            images: t.images || [],
            avatar: t.avatar,
            date: t.date,
            address: t.address
        }));
        if (testimonialDocs.length > 0) {
            await testimonialsCollection.insertMany(testimonialDocs);
        }

        console.log('Native seeding completed successfully.');
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await client.close();
    }
}

main();
