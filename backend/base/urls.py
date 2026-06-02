from django.urls import path
from . import views

urlpatterns = [
    path('products/', views.product_list, name='product-list'),
    path('products/<int:pk>/', views.get_product_by_id, name='get-product-by-id'),
    path('cart/', views.read_cart, name='read-cart'),
    path('cart/add/', views.add_to_cart, name='add-to-cart'),
    path('cart/update/<int:pk>/', views.update_cart_item, name='update-cart-item'),
    path('cart/remove/<int:pk>/', views.remove_from_cart, name='remove-from-cart'),

    path('register/', views.register_user, name='register-user'),
    path('user-profile/', views.get_user_profile, name='user-profile'),
    path('user-profile/photo/', views.update_profile_photo, name='update-profile-photo'),
    path('user-profile/password/', views.change_password, name='change-password'),
]
