from django.contrib import admin
from .models import (
    Order,
    OrderItem,
    Prodct,
    ProductReview,
    UserProfile,
    WishlistItem,
    paymentMethod,
    shippingAddress,
)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'product_name', 'brand', 'unit_price', 'qty', 'line_total')
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'status',
        'payment_status',
        'total_amount',
        'createdAt',
    )
    list_filter = ('status', 'payment_status', 'createdAt')
    search_fields = ('user__username', 'shipping_full_name', 'shipping_email')
    inlines = [OrderItemInline]


@admin.register(Prodct)
class ProdctAdmin(admin.ModelAdmin):
    list_display = (
        'product_name',
        'owner',
        'brand',
        'category',
        'product_price',
        'countInStock',
        'is_featured',
        'is_active',
    )
    list_filter = ('owner', 'brand', 'category', 'is_featured', 'is_active')
    search_fields = (
        'product_name',
        'brand',
        'category',
        'owner__username',
        'owner__email',
    )


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'createdAt')
    search_fields = ('user__username', 'product__product_name')


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'rating', 'is_visible', 'createdAt')
    list_filter = ('rating', 'is_visible', 'createdAt')
    search_fields = ('product__product_name', 'user__username')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'full_name', 'display_name', 'country')
    list_filter = ('role', 'gender', 'country')
    search_fields = ('user__username', 'user__email', 'full_name', 'display_name')


@admin.register(paymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'order',
        'totalPrice',
        'isPaid',
        'xendit_status',
        'paidAt',
    )
    list_filter = ('isPaid', 'xendit_status', 'paidAt')
    search_fields = (
        'user__username',
        'user__email',
        'order__id',
        'xendit_invoice_id',
        'xendit_external_id',
    )


@admin.register(shippingAddress)
class ShippingAddressAdmin(admin.ModelAdmin):
    list_display = ('fullName', 'city', 'country', 'paymentId')
    search_fields = (
        'fullName',
        'city',
        'country',
        'paymentId__user__username',
        'paymentId__xendit_external_id',
    )
