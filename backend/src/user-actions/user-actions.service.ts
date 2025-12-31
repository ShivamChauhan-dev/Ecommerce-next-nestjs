import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/user-actions.dto';

@Injectable()
export class UserActionsService {
    constructor(private prisma: PrismaService) { }

    // --- CART ---

    async getCart(userId: string) {
        const cart = await this.prisma.cart.findUnique({
            where: { userId },
            include: {
                items: true
            }
        });

        if (!cart) {
            return { items: [] };
        }

        const productIds = cart.items.map(i => i.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } }
        });

        return {
            ...cart,
            items: cart.items.map(item => {
                const product = products.find(p => p.id === item.productId);
                // Assuming product exists, else minimal info
                return {
                    ...item,
                    product: product || { name: 'Unknown Product', price: 0, images: [] }
                };
            })
        };
    }

    async addToCart(userId: string, dto: AddToCartDto) {
        let cart = await this.prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            cart = await this.prisma.cart.create({ data: { userId } });
        }

        const existingItem = await this.prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                productId: dto.productId,
                selectedColor: dto.selectedColor,
                selectedSize: dto.selectedSize
            }
        });

        if (existingItem) {
            return this.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + dto.quantity }
            });
        } else {
            return this.prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId: dto.productId,
                    quantity: dto.quantity,
                    selectedColor: dto.selectedColor,
                    selectedSize: dto.selectedSize
                }
            });
        }
    }

    async removeItemFromCart(userId: string, itemId: string) {
        return this.prisma.cartItem.delete({ where: { id: itemId } });
    }

    async updateCartItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
        return this.prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity: dto.quantity }
        });
    }

    // --- WISHLIST ---

    async getWishlist(userId: string) {
        const wishlist = await this.prisma.wishlist.findUnique({
            where: { userId },
            include: { products: true }
        });
        return wishlist ? wishlist.products : [];
    }

    async toggleWishlist(userId: string, productId: string) {
        let wishlist = await this.prisma.wishlist.findUnique({ where: { userId } });
        if (!wishlist) {
            wishlist = await this.prisma.wishlist.create({
                data: { userId, productIDs: [] }
            });
        }

        const exists = wishlist.productIDs.includes(productId);

        if (exists) {
            await this.prisma.wishlist.update({
                where: { id: wishlist.id },
                data: {
                    products: { disconnect: { id: productId } }
                }
            });
        } else {
            await this.prisma.wishlist.update({
                where: { id: wishlist.id },
                data: {
                    products: { connect: { id: productId } }
                }
            });
        }

        return this.getWishlist(userId);
    }

    // --- COMPARE ---

    async getCompare(userId: string) {
        const compare = await this.prisma.compareList.findUnique({
            where: { userId },
            include: { products: { include: { variations: true } } }
        });
        return compare ? compare.products : [];
    }

    async toggleCompare(userId: string, productId: string) {
        let compare = await this.prisma.compareList.findUnique({ where: { userId } });
        if (!compare) {
            compare = await this.prisma.compareList.create({
                data: { userId, productIDs: [] }
            });
        }

        const exists = compare.productIDs.includes(productId);

        if (exists) {
            await this.prisma.compareList.update({
                where: { id: compare.id },
                data: {
                    products: { disconnect: { id: productId } }
                }
            });
        } else {
            await this.prisma.compareList.update({
                where: { id: compare.id },
                data: {
                    products: { connect: { id: productId } }
                }
            });
        }

        return this.getCompare(userId);
    }
}
