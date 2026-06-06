from django.urls import path
from . import views

urlpatterns = [
    path('products/', views.product_list, name='product-list'),
    path('products/filters/', views.product_filters, name='product-filters'),
    path('products/<int:pk>/', views.get_product_by_id, name='get-product-by-id'),
    path('products/<int:product_id>/reviews/', views.product_reviews, name='product-reviews'),
    path('cart/', views.read_cart, name='read-cart'),
    path('cart/add/', views.add_to_cart, name='add-to-cart'),
    path('cart/update/<int:pk>/', views.update_cart_item, name='update-cart-item'),
    path('cart/remove/<int:pk>/', views.remove_from_cart, name='remove-from-cart'),
    path('orders/', views.orders, name='orders'),
    path('orders/<int:pk>/', views.order_detail, name='order-detail'),
    path('payments/xendit/checkout/', views.xendit_checkout, name='xendit-checkout'),
    path('payments/xendit/webhook/', views.xendit_webhook, name='xendit-webhook'),
    path('wishlist/', views.wishlist, name='wishlist'),
    path('wishlist/<int:product_id>/', views.remove_wishlist_item, name='remove-wishlist-item'),
    path('me/', views.me, name='me'),
    path('business/summary/', views.business_dashboard_summary, name='business-summary'),
    path('business/products/', views.business_products, name='business-products'),
    path('business/products/<int:pk>/', views.business_product_detail, name='business-product-detail'),
    path('business/orders/', views.business_orders, name='business-orders'),
    path('business/orders/<int:pk>/', views.business_order_detail, name='business-order-detail'),
    path('business/customers/', views.business_customers, name='business-customers'),
    path('business/customers/<int:pk>/', views.business_customer_detail, name='business-customer-detail'),
    path('business/reviews/', views.business_reviews, name='business-reviews'),
    path('business/reviews/<int:pk>/', views.business_review_detail, name='business-review-detail'),

    path('register/', views.register_user, name='register-user'),
    path('user-profile/', views.get_user_profile, name='user-profile'),
    path('user-profile/photo/', views.update_profile_photo, name='update-profile-photo'),
    path('user-profile/password/', views.change_password, name='change-password'),
]
